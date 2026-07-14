import type { Secret, SecretPayload, SecretSource, SecretVersion } from "../types.js";
import { SecretType as SecretTypeEnum } from "../types.js";
import type { ConfigurationProvider } from "../../config/types.js";

const SECRETS_CONFIG_PREFIX = "secrets.";

export class ConfigurationSource implements SecretSource {
  readonly name = "configuration";
  readonly priority: number;
  readonly enabled: boolean;
  private readonly configProvider: ConfigurationProvider;

  constructor(configProvider: ConfigurationProvider, priority = 20, enabled = true) {
    this.configProvider = configProvider;
    this.priority = priority;
    this.enabled = enabled;
  }

  async get(type: import("../types.js").SecretType, key: string): Promise<Secret | null> {
    const configKey = this.toConfigKey(key);
    const rawValue = await this.configProvider.get<Record<string, unknown>>(configKey);

    if (rawValue === undefined) {
      return null;
    }

    return this.buildSecret(type, key, rawValue);
  }

  async has(type: import("../types.js").SecretType, key: string): Promise<boolean> {
    const configKey = this.toConfigKey(key);

    return this.configProvider.has(configKey);
  }

  async getAll(): Promise<Secret[]> {
    const allConfig = await this.configProvider.getAll();
    const secrets: Secret[] = [];

    for (const [configKey, value] of allConfig) {
      if (!configKey.startsWith(SECRETS_CONFIG_PREFIX) || typeof value !== "object" || value === null) {
        continue;
      }

      const secretKey = configKey.slice(SECRETS_CONFIG_PREFIX.length);
      const type = this.inferType(secretKey);

      if (type) {
        const secret = this.buildSecret(type, secretKey, value as Record<string, unknown>);

        if (secret) {
          secrets.push(secret);
        }
      }
    }

    return secrets;
  }

  private toConfigKey(key: string): string {
    return `${SECRETS_CONFIG_PREFIX}${key}`;
  }

  private inferType(key: string): import("../types.js").SecretType | null {
    if (key.startsWith("db_") || key.startsWith("database_")) { return SecretTypeEnum.DatabaseCredentials; }
    if (key.startsWith("jwt_")) { return SecretTypeEnum.JwtSigningKey; }
    if (key.startsWith("api_")) { return SecretTypeEnum.ApiKey; }
    if (key.startsWith("smtp_")) { return SecretTypeEnum.SmtpCredentials; }
    if (key.startsWith("storage_")) { return SecretTypeEnum.StorageCredentials; }
    if (key.startsWith("wh_") || key.startsWith("webhook_")) { return SecretTypeEnum.WebhookSecret; }
    if (key.startsWith("enc_") || key.startsWith("encryption_")) { return SecretTypeEnum.EncryptionKey; }
    if (key.startsWith("oauth_")) { return SecretTypeEnum.OAuthClientSecret; }

    return null;
  }

  private buildSecret(type: import("../types.js").SecretType, key: string, value: Record<string, unknown>): Secret {
    const payload = this.createPayload(type, value);
    const version: SecretVersion = {
      version: 1,
      value: payload,
      createdAt: new Date(),
      status: "active",
    };

    return {
      metadata: {
        id: `cfg_${key}`,
        key,
        type,
        name: key,
        currentVersion: 1,
        versions: [version],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      current: payload,
    };
  }

  private createPayload(type: import("../types.js").SecretType, value: Record<string, unknown>): import("../types.js").SecretPayload {
    switch (type) {
      case SecretTypeEnum.DatabaseCredentials:
        return {
          host: String(value["host"] ?? ""),
          port: Number(value["port"] ?? 3306),
          username: String(value["username"] ?? ""),
          password: String(value["password"] ?? ""),
          database: String(value["database"] ?? ""),
          ssl: value["ssl"] === true || value["ssl"] === "true",
          connectionString: value["connectionString"] as string | undefined,
        } as import("../types.js").DatabaseCredentials;
      case SecretTypeEnum.JwtSigningKey:
        return {
          key: String(value["key"] ?? ""),
          algorithm: String(value["algorithm"] ?? "HS256"),
          kid: value["kid"] as string | undefined,
          publicKey: value["publicKey"] as string | undefined,
        } as import("../types.js").JwtSigningKeyValue;
      case SecretTypeEnum.ApiKey:
        return {
          key: String(value["key"] ?? ""),
          prefix: value["prefix"] as string | undefined,
          permissions: value["permissions"] as string[] | undefined,
        } as import("../types.js").ApiKeyValue;
      case SecretTypeEnum.SmtpCredentials:
        return {
          host: String(value["host"] ?? ""),
          port: Number(value["port"] ?? 587),
          username: String(value["username"] ?? ""),
          password: String(value["password"] ?? ""),
          secure: value["secure"] === true || value["secure"] === "true",
          fromAddress: value["fromAddress"] as string | undefined,
        } as import("../types.js").SmtpCredentials;
      case SecretTypeEnum.StorageCredentials:
        return {
          accessKeyId: String(value["accessKeyId"] ?? ""),
          secretAccessKey: String(value["secretAccessKey"] ?? ""),
          region: value["region"] as string | undefined,
          bucket: value["bucket"] as string | undefined,
          endpoint: value["endpoint"] as string | undefined,
        } as import("../types.js").StorageCredentials;
      case SecretTypeEnum.WebhookSecret:
        return {
          secret: String(value["secret"] ?? ""),
          url: value["url"] as string | undefined,
          signatureHeader: value["signatureHeader"] as string | undefined,
        } as import("../types.js").WebhookSecretValue;
      case SecretTypeEnum.EncryptionKey:
        return {
          key: String(value["key"] ?? ""),
          algorithm: String(value["algorithm"] ?? "AES-256-GCM"),
          initializationVector: value["initializationVector"] as string | undefined,
          keyId: value["keyId"] as string | undefined,
        } as import("../types.js").EncryptionKeyValue;
      case SecretTypeEnum.OAuthClientSecret:
        return {
          clientId: String(value["clientId"] ?? ""),
          clientSecret: String(value["clientSecret"] ?? ""),
          authorizationUrl: value["authorizationUrl"] as string | undefined,
          tokenUrl: value["tokenUrl"] as string | undefined,
          scopes: value["scopes"] as string[] | undefined,
        } as import("../types.js").OAuthClientSecretValue;
    }
  }
}
