import { describe, it, expect, vi, beforeEach } from "vitest";
import { SecretManager } from "../SecretManager.js";
import { SecretType } from "../types.js";
import { SecretNotFoundError, SecretValidationFailedError } from "../errors.js";

function createMockSource() {
  return {
    name: "test",
    priority: 10,
    enabled: true,
    get: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn().mockResolvedValue([]),
  };
}

describe("SecretManager", () => {
  let manager: SecretManager;

  beforeEach(() => {
    manager = new SecretManager();
  });

  describe("source management", () => {
    it("adds and removes sources", () => {
      const source = createMockSource();
      manager.addSource(source);

      expect(manager.getSources()).toHaveLength(1);

      manager.removeSource("test");

      expect(manager.getSources()).toHaveLength(0);
    });
  });

  describe("secret registration", () => {
    it("registers a secret and returns metadata", () => {
      const metadata = manager.registerSecret({
        key: "db_main",
        type: SecretType.DatabaseCredentials,
        name: "Main Database",
        description: "Primary database credentials",
        currentVersion: 1,
        versions: [
          {
            version: 1,
            value: {
              host: "localhost",
              port: 3306,
              username: "admin",
              password: "secret",
              database: "tableflow",
            },
            createdAt: new Date(),
            status: "active",
          },
        ],
      });

      expect(metadata.key).toBe("db_main");
      expect(metadata.id).toContain("sec_db_main");
      expect(metadata.type).toBe(SecretType.DatabaseCredentials);

      const retrieved = manager.getRegisteredMetadata("db_main");

      expect(retrieved).not.toBeNull();
      expect(retrieved!.key).toBe("db_main");
    });

    it("returns null for unregistered secret metadata", () => {
      const result = manager.getRegisteredMetadata("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("secret provider", () => {
    it("throws SecretNotFoundError when secret does not exist", async () => {
      await expect(
        manager.provider.getSecretOrFail("nonexistent", SecretType.ApiKey),
      ).rejects.toThrow(SecretNotFoundError);
    });

    it("returns null for nonexistent secret via getSecret", async () => {
      const result = await manager.provider.getSecret("nonexistent", SecretType.ApiKey);

      expect(result).toBeNull();
    });

    it("checks existence via hasSecret", async () => {
      manager.registerSecret({
        key: "api_key",
        type: SecretType.ApiKey,
        name: "Test API Key",
        currentVersion: 1,
        versions: [
          {
            version: 1,
            value: { key: "sk-test123" },
            createdAt: new Date(),
            status: "active",
          },
        ],
      });

      const exists = await manager.provider.hasSecret("api_key", SecretType.ApiKey);

      expect(exists).toBe(true);

      const notExists = await manager.provider.hasSecret("unknown", SecretType.ApiKey);

      expect(notExists).toBe(false);
    });

    it("resolves secrets from registered sources", async () => {
      const source = createMockSource();

      source.get.mockResolvedValue({
        metadata: {
          id: "test_id",
          key: "api_external",
          type: SecretType.ApiKey,
          name: "External API",
          currentVersion: 1,
          versions: [
            {
              version: 1,
              value: { key: "sk-external-key" },
              createdAt: new Date(),
              status: "active",
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        current: { key: "sk-external-key" },
      });

      manager.addSource(source);

      const result = await manager.provider.getSecret("api_external", SecretType.ApiKey);

      expect(result).toEqual({ key: "sk-external-key" });
      expect(source.get).toHaveBeenCalledWith(SecretType.ApiKey, "api_external");
    });

    it("provides rotation status for registered secrets", async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      manager.registerSecret({
        key: "jwt_main",
        type: SecretType.JwtSigningKey,
        name: "JWT Signing Key",
        currentVersion: 1,
        versions: [
          {
            version: 1,
            value: { key: "my-signing-key", algorithm: "HS256" },
            createdAt: new Date(),
            status: "active",
          },
        ],
        expiresAt,
        rotationPolicy: {
          maxAgeMs: 90 * 24 * 60 * 60 * 1000,
          rotateBeforeExpiryMs: 7 * 24 * 60 * 60 * 1000,
          versionsToKeep: 2,
          autoRotate: false,
          notifyOnRotation: true,
        },
      });

      const status = await manager.provider.getRotationStatus("jwt_main");

      expect(status).not.toBeNull();
      expect(status!.secretKey).toBe("jwt_main");
      expect(status!.currentVersion).toBe(1);
    });

    it("returns null rotation status for unregistered secrets", async () => {
      const status = await manager.provider.getRotationStatus("unknown");

      expect(status).toBeNull();
    });
  });

  describe("secret rotation", () => {
    it("rotates a secret and increments version", async () => {
      manager.registerSecret({
        key: "api_key",
        type: SecretType.ApiKey,
        name: "Test API Key",
        currentVersion: 1,
        versions: [
          {
            version: 1,
            value: { key: "sk-old-key" },
            createdAt: new Date(Date.now() - 86400000),
            status: "active",
          },
        ],
      });

      const rotated = await manager.rotateSecret("api_key", { key: "sk-new-key" });

      expect(rotated.metadata.currentVersion).toBe(2);
      expect((rotated.current as { key: string }).key).toBe("sk-new-key");
      expect(rotated.metadata.lastRotatedAt).not.toBeUndefined();

      const metadata = manager.getRegisteredMetadata("api_key");

      expect(metadata!.currentVersion).toBe(2);
      expect(metadata!.versions).toHaveLength(2);
    });

    it("throws when rotating nonexistent secret", async () => {
      await expect(
        manager.rotateSecret("nonexistent", { key: "new" }),
      ).rejects.toThrow(SecretNotFoundError);
    });

    it("throws when new value fails validation", async () => {
      manager.registerSecret({
        key: "db_main",
        type: SecretType.DatabaseCredentials,
        name: "Database",
        currentVersion: 1,
        versions: [
          {
            version: 1,
            value: {
              host: "localhost",
              port: 3306,
              username: "admin",
              password: "secret",
              database: "tableflow",
            },
            createdAt: new Date(),
            status: "active",
          },
        ],
      });

      await expect(
        manager.rotateSecret("db_main", {} as import("../types.js").DatabaseCredentials),
      ).rejects.toThrow(SecretValidationFailedError);
    });
  });

  describe("secret validation", () => {
    it("validates a registered secret successfully", async () => {
      manager.registerSecret({
        key: "api_key",
        type: SecretType.ApiKey,
        name: "API Key",
        currentVersion: 1,
        versions: [
          {
            version: 1,
            value: { key: "sk-valid-key" },
            createdAt: new Date(),
            status: "active",
          },
        ],
      });

      const result = await manager.validateSecret("api_key");

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns errors for unregistered secret", async () => {
      const result = await manager.validateSecret("unknown");

      expect(result.valid).toBe(false);
    });

    it("validates all secrets", async () => {
      manager.registerSecret({
        key: "api_key",
        type: SecretType.ApiKey,
        name: "API Key",
        currentVersion: 1,
        versions: [
          {
            version: 1,
            value: { key: "sk-valid" },
            createdAt: new Date(),
            status: "active",
          },
        ],
      });

      manager.registerSecret({
        key: "api_empty",
        type: SecretType.ApiKey,
        name: "Empty API Key",
        currentVersion: 1,
        versions: [],
      });

      const results = await manager.validateAllSecrets();

      expect(results.size).toBe(2);
      expect(results.get("api_key")!.valid).toBe(true);
      expect(results.get("api_empty")!.valid).toBe(false);
    });
  });

  describe("refresh secret", () => {
    it("does not throw for unregistered secrets", async () => {
      await expect(
        manager.provider.refreshSecret("unknown"),
      ).resolves.not.toThrow();
    });
  });
});
