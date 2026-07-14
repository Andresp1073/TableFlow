import type {
  SecretManagerInterface,
  SecretProvider,
  SecretSource,
  SecretType as SecretTypeInterface,
  Secret,
  SecretPayload,
  SecretMetadata,
  SecretVersion,
  SecretValidationResult,
  RotationStatus,
  SecretCacheConfig,
  SecretRotationPolicyConfig,
  Logger,
  EventPublisher,
} from "./types.js";
import { SecretType } from "./types.js";
import type { CacheProvider, SetCacheOptions } from "../cache/types.js";
import { SecretResolver } from "./SecretResolver.js";
import { SecretValidator } from "./SecretValidator.js";
import { SecretCache } from "./SecretCache.js";
import { computeRotationStatus, createDefaultRotationPolicy } from "./SecretRotationPolicy.js";
import { publishSecretEvent } from "./events.js";
import {
  SecretNotFoundError,
  SecretRotationFailedError,
  SecretValidationFailedError,
} from "./errors.js";

export class SecretManager implements SecretManagerInterface {
  readonly provider: SecretProvider;
  private readonly resolver: SecretResolver;
  private readonly validator: SecretValidator;
  private readonly registeredSecrets: Map<string, SecretMetadata> = new Map();
  private cache?: SecretCache;
  private logger?: Logger;
  private eventPublisher?: EventPublisher;

  constructor() {
    this.resolver = new SecretResolver();
    this.validator = new SecretValidator();
    this.provider = this.createProvider();
  }

  addSource(source: SecretSource): void {
    this.resolver.addSource(source);
    this.logger?.info(`Secret source added: ${source.name}`, { priority: source.priority });
  }

  removeSource(name: string): void {
    this.resolver.removeSource(name);
    this.logger?.info(`Secret source removed: ${name}`);
  }

  getSources(): SecretSource[] {
    return this.resolver.getSources();
  }

  registerSecret(metadata: Omit<SecretMetadata, "id" | "createdAt" | "updatedAt">): SecretMetadata {
    const id = `sec_${metadata.key}_${Date.now()}`;
    const now = new Date();

    const fullMetadata: SecretMetadata = {
      ...metadata,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.registeredSecrets.set(metadata.key, fullMetadata);
    this.logger?.info(`Secret registered: ${metadata.key}`, { type: metadata.type });

    return fullMetadata;
  }

  getRegisteredMetadata(key: string): SecretMetadata | null {
    return this.registeredSecrets.get(key) ?? null;
  }

  getRegisteredSecrets(): Map<string, SecretMetadata> {
    return new Map(this.registeredSecrets);
  }

  async rotateSecret(key: string, newValue: SecretPayload, rotatedBy?: string): Promise<Secret> {
    const type = this.resolveType(key);
    const registered = this.registeredSecrets.get(key);

    if (!registered) {
      throw new SecretNotFoundError(key, type);
    }

    const existing = await this.resolveSecret(key, type) ?? this.buildSecretFromRegistration(registered);

    const validationResult = this.validator.validateRequired(existing.metadata, newValue);

    if (validationResult.length > 0) {
      throw new SecretValidationFailedError(key, type, validationResult);
    }

    const latestVersion = existing.metadata.versions[existing.metadata.versions.length - 1];
    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    const previousVersions = existing.metadata.versions.map((v) => ({
      ...v,
      status: v.version === existing.metadata.currentVersion ? "previous" as const : v.status,
    }));

    const newVersion: SecretVersion = {
      version: newVersionNumber,
      value: newValue,
      createdAt: new Date(),
      createdBy: rotatedBy,
      status: "active",
    };

    const updatedVersions = [...previousVersions, newVersion];

    const rotationPolicy = existing.metadata.rotationPolicy;
    const versionsToKeep = rotationPolicy?.versionsToKeep ?? 2;
    const trimmedVersions = updatedVersions.length > versionsToKeep
      ? updatedVersions.slice(updatedVersions.length - versionsToKeep)
      : updatedVersions;

    const updatedMetadata: SecretMetadata = {
      ...existing.metadata,
      currentVersion: newVersionNumber,
      versions: trimmedVersions,
      lastRotatedAt: new Date(),
      updatedAt: new Date(),
    };

    this.registeredSecrets.set(key, updatedMetadata);

    if (this.cache) {
      await this.cache.invalidate(key);
    }

    const rotatedSecret: Secret = {
      metadata: updatedMetadata,
      current: newValue,
    };

    await publishSecretEvent(
      this.eventPublisher,
      this.logger,
      "secret.rotated",
      key,
      type,
      { previousVersion: existing.metadata.currentVersion, newVersion: newVersionNumber, rotatedBy },
    );

    this.logger?.info(`Secret rotated: ${key}`, {
      newVersion: newVersionNumber,
      previousVersion: existing.metadata.currentVersion,
      rotatedBy,
    });

    return rotatedSecret;
  }

  async validateSecret(key: string): Promise<SecretValidationResult> {
    const metadata = this.registeredSecrets.get(key);

    if (!metadata) {
      return {
        valid: false,
        errors: [{ field: "key", message: `Secret "${key}" is not registered`, code: "missing_required" }],
        warnings: [],
      };
    }

    const activeVersion = metadata.versions.find((v) => v.status === "active");

    if (!activeVersion) {
      return {
        valid: false,
        errors: [{ field: "versions", message: `Secret "${key}" has no active version`, code: "version_outdated" }],
        warnings: [],
      };
    }

    return this.validator.validate(metadata, activeVersion.value);
  }

  async validateAllSecrets(): Promise<Map<string, SecretValidationResult>> {
    const results = new Map<string, SecretValidationResult>();

    for (const [key, metadata] of this.registeredSecrets) {
      const activeVersion = metadata.versions.find((v) => v.status === "active");

      if (!activeVersion) {
        results.set(key, {
          valid: false,
          errors: [{ field: "versions", message: `No active version`, code: "version_outdated" }],
          warnings: [],
        });
        continue;
      }

      const result = this.validator.validate(metadata, activeVersion.value);
      results.set(key, result);

      if (!result.valid) {
        await publishSecretEvent(
          this.eventPublisher,
          this.logger,
          "secret.validation_failed",
          key,
          metadata.type,
          { errors: result.errors },
        );
      }
    }

    return results;
  }

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  setEventPublisher(publisher: EventPublisher): void {
    this.eventPublisher = publisher;
  }

  setCacheProvider(provider: CacheProvider, config?: SecretCacheConfig, options?: SetCacheOptions): void {
    this.cache = new SecretCache(provider, config, options);
  }

  private createProvider(): SecretProvider {
    const manager = this;

    return {
      async getSecret<T extends SecretPayload>(key: string, type: SecretType): Promise<T | null> {
        const secret = await manager.resolveSecret(key, type);

        return secret ? (secret.current as T) : null;
      },

      async getSecretOrFail<T extends SecretPayload>(key: string, type: SecretType): Promise<T> {
        const value = await manager.provider.getSecret<T>(key, type);

        if (value === null) {
          throw new SecretNotFoundError(key, type);
        }

        return value;
      },

      async hasSecret(key: string, type: SecretType): Promise<boolean> {
        if (manager.registeredSecrets.has(key)) {
          return true;
        }

        return manager.resolver.exists(type, key);
      },

      async getSecretMetadata(key: string): Promise<SecretMetadata | null> {
        return manager.registeredSecrets.get(key) ?? null;
      },

      async refreshSecret(key: string): Promise<void> {
        await manager.cache?.invalidate(key);

        const metadata = manager.registeredSecrets.get(key);

        if (!metadata) {
          return;
        }

        const secret = await manager.resolveSecret(key, metadata.type);

        if (secret) {
          this.logger?.debug(`Secret refreshed: ${key}`);
        }
      },

      async getRotationStatus(key: string): Promise<RotationStatus | null> {
        const metadata = manager.registeredSecrets.get(key);

        if (!metadata) {
          return null;
        }

        const policy = metadata.rotationPolicy ?? createDefaultRotationPolicy();

        return computeRotationStatus(key, metadata, policy);
      },
    };
  }

  private async resolveSecret(key: string, type: SecretType): Promise<Secret | null> {
    if (this.cache) {
      const cached = await this.cache.get(key);

      if (cached) {
        return cached;
      }
    }

    const secret = await this.resolver.resolve(type, key);

    if (secret && this.cache) {
      await this.cache.set(secret);
      await publishSecretEvent(
        this.eventPublisher,
        this.logger,
        "secret.loaded",
        key,
        type,
        { source: "resolver" },
      );
    }

    return secret;
  }

  private buildSecretFromRegistration(metadata: SecretMetadata): Secret | null {
    const activeVersion = metadata.versions.find((v) => v.status === "active");

    if (!activeVersion) {
      return null;
    }

    return {
      metadata,
      current: activeVersion.value,
    };
  }

  private resolveType(key: string): SecretTypeInterface {
    const registered = this.registeredSecrets.get(key);

    if (registered) {
      return registered.type;
    }

    if (key.startsWith("db_")) { return SecretType.DatabaseCredentials; }
    if (key.startsWith("jwt_")) { return SecretType.JwtSigningKey; }
    if (key.startsWith("api_")) { return SecretType.ApiKey; }
    if (key.startsWith("smtp_")) { return SecretType.SmtpCredentials; }
    if (key.startsWith("storage_")) { return SecretType.StorageCredentials; }
    if (key.startsWith("wh_")) { return SecretType.WebhookSecret; }
    if (key.startsWith("enc_")) { return SecretType.EncryptionKey; }
    if (key.startsWith("oauth_")) { return SecretType.OAuthClientSecret; }

    return SecretType.ApiKey;
  }
}
