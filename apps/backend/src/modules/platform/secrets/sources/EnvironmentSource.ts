import type { Secret, SecretPayload, SecretSource, SecretVersion } from "../types.js";
import { SecretType } from "../types.js";

const ENV_PREFIX = "SECRET_";

export class EnvironmentSource implements SecretSource {
  readonly name = "environment";
  readonly priority: number;
  readonly enabled: boolean;

  constructor(priority = 10, enabled = true) {
    this.priority = priority;
    this.enabled = enabled;
  }

  async get(type: import("../types.js").SecretType, key: string): Promise<Secret | null> {
    const envKey = this.toEnvKey(key);
    const rawValue = process.env[envKey];

    if (rawValue === undefined || rawValue === null) {
      return null;
    }

    return this.parseSecret(type, key, rawValue);
  }

  async has(type: import("../types.js").SecretType, key: string): Promise<boolean> {
    const envKey = this.toEnvKey(key);

    return process.env[envKey] !== undefined && process.env[envKey] !== null;
  }

  async getAll(): Promise<Secret[]> {
    const secrets: Secret[] = [];

    for (const [envKey, value] of Object.entries(process.env)) {
      if (!envKey.startsWith(ENV_PREFIX) || value === undefined) {
        continue;
      }

      const secretKey = envKey.slice(ENV_PREFIX.length).toLowerCase();
      const type = this.inferType(secretKey);

      if (type) {
        const secret = await this.parseSecret(type, secretKey, value);

        if (secret) {
          secrets.push(secret);
        }
      }
    }

    return secrets;
  }

  private toEnvKey(key: string): string {
    return `${ENV_PREFIX}${key.toUpperCase().replace(/[.-]/g, "_")}`;
  }

  private inferType(key: string): import("../types.js").SecretType | null {
    if (key.startsWith("db_") || key.startsWith("database_")) { return SecretType.DatabaseCredentials; }
    if (key.startsWith("jwt_")) { return SecretType.JwtSigningKey; }
    if (key.startsWith("api_")) { return SecretType.ApiKey; }
    if (key.startsWith("smtp_")) { return SecretType.SmtpCredentials; }
    if (key.startsWith("storage_")) { return SecretType.StorageCredentials; }
    if (key.startsWith("wh_") || key.startsWith("webhook_")) { return SecretType.WebhookSecret; }
    if (key.startsWith("enc_") || key.startsWith("encryption_")) { return SecretType.EncryptionKey; }
    if (key.startsWith("oauth_")) { return SecretType.OAuthClientSecret; }

    return null;
  }

  private parseSecret(type: import("../types.js").SecretType, key: string, rawValue: string): Secret | null {
    try {
      const parsed = JSON.parse(rawValue) as Record<string, unknown>;

      return this.buildSecret(type, key, parsed);
    } catch {
      if (type === SecretType.ApiKey) {
        return this.buildSecret(type, key, { key: rawValue });
      }

      return null;
    }
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
        id: `env_${key}`,
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

  private createPayload(type: import("../types.js").SecretType, value: Record<string, unknown>): SecretPayload {
    switch (type) {
      case SecretType.DatabaseCredentials:
        return {
          host: String(value["host"] ?? ""),
          port: Number(value["port"] ?? 3306),
          username: String(value["username"] ?? ""),
          password: String(value["password"] ?? ""),
          database: String(value["database"] ?? ""),
          ssl: value["ssl"] === true || value["ssl"] === "true",
          connectionString: value["connectionString"] as string | undefined,
        } as import("../types.js").DatabaseCredentials;
      case SecretType.JwtSigningKey:
        return {
          key: String(value["key"] ?? ""),
          algorithm: String(value["algorithm"] ?? "HS256"),
          kid: value["kid"] as string | undefined,
          publicKey: value["publicKey"] as string | undefined,
        } as import("../types.js").JwtSigningKeyValue;
      case SecretType.ApiKey:
        return {
          key: String(value["key"] ?? ""),
          prefix: value["prefix"] as string | undefined,
          permissions: value["permissions"] as string[] | undefined,
        } as import("../types.js").ApiKeyValue;
      case SecretType.SmtpCredentials:
        return {
          host: String(value["host"] ?? ""),
          port: Number(value["port"] ?? 587),
          username: String(value["username"] ?? ""),
          password: String(value["password"] ?? ""),
          secure: value["secure"] === true || value["secure"] === "true",
          fromAddress: value["fromAddress"] as string | undefined,
        } as import("../types.js").SmtpCredentials;
      case SecretType.StorageCredentials:
        return {
          accessKeyId: String(value["accessKeyId"] ?? ""),
          secretAccessKey: String(value["secretAccessKey"] ?? ""),
          region: value["region"] as string | undefined,
          bucket: value["bucket"] as string | undefined,
          endpoint: value["endpoint"] as string | undefined,
        } as import("../types.js").StorageCredentials;
      case SecretType.WebhookSecret:
        return {
          secret: String(value["secret"] ?? ""),
          url: value["url"] as string | undefined,
          signatureHeader: value["signatureHeader"] as string | undefined,
        } as import("../types.js").WebhookSecretValue;
      case SecretType.EncryptionKey:
        return {
          key: String(value["key"] ?? ""),
          algorithm: String(value["algorithm"] ?? "AES-256-GCM"),
          initializationVector: value["initializationVector"] as string | undefined,
          keyId: value["keyId"] as string | undefined,
        } as import("../types.js").EncryptionKeyValue;
      case SecretType.OAuthClientSecret:
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
