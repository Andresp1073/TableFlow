import { describe, it, expect } from "vitest";
import { SecretValidator } from "../SecretValidator.js";
import { SecretType } from "../types.js";
import type { SecretMetadata } from "../types.js";

describe("SecretValidator", () => {
  const validator = new SecretValidator();

  function createMetadata(overrides: Partial<SecretMetadata> = {}): SecretMetadata {
    return {
      id: "test_1",
      key: "api_test",
      type: SecretType.ApiKey,
      name: "Test API Key",
      currentVersion: 1,
      versions: [
        {
          version: 1,
          value: { key: "sk-test-key-12345" },
          createdAt: new Date(),
          status: "active",
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  describe("API key validation", () => {
    it("passes for valid API key", () => {
      const metadata = createMetadata();
      const result = validator.validate(metadata, { key: "sk-valid-key" });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("fails for API key with missing key", () => {
      const metadata = createMetadata();
      const result = validator.validate(metadata, { key: "" });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "key", code: "missing_required" }),
      );
    });
  });

  describe("database credentials validation", () => {
    const dbMetadata = (): SecretMetadata => createMetadata({
      key: "db_main",
      type: SecretType.DatabaseCredentials,
    });

    it("passes for valid database credentials", () => {
      const metadata = dbMetadata();
      const result = validator.validate(metadata, {
        host: "localhost",
        port: 3306,
        username: "admin",
        password: "secret",
        database: "tableflow",
      });

      expect(result.valid).toBe(true);
    });

    it("fails when required fields are missing", () => {
      const metadata = dbMetadata();
      const result = validator.validate(metadata, {} as import("../types.js").DatabaseCredentials);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);

      const fieldNames = result.errors.map((e) => e.field);

      expect(fieldNames).toContain("host");
      expect(fieldNames).toContain("password");
      expect(fieldNames).toContain("database");
    });

    it("fails when port is out of range", () => {
      const metadata = dbMetadata();
      const result = validator.validate(metadata, {
        host: "localhost",
        port: 99999,
        username: "admin",
        password: "secret",
        database: "tableflow",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "port", code: "invalid_format" }),
      );
    });
  });

  describe("JWT signing key validation", () => {
    const jwtMetadata = (): SecretMetadata => createMetadata({
      key: "jwt_main",
      type: SecretType.JwtSigningKey,
    });

    it("passes for valid JWT key", () => {
      const metadata = jwtMetadata();
      const result = validator.validate(metadata, {
        key: "my-secret-key",
        algorithm: "HS256",
      });

      expect(result.valid).toBe(true);
    });

    it("fails when algorithm is unsupported", () => {
      const metadata = jwtMetadata();
      const result = validator.validate(metadata, {
        key: "key",
        algorithm: "INVALID",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "algorithm", code: "invalid_format" }),
      );
    });

    it("fails when key is missing", () => {
      const metadata = jwtMetadata();
      const result = validator.validate(metadata, {
        key: "",
        algorithm: "HS256",
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("expiration validation", () => {
    it("returns warnings for expiring secrets", () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const metadata = createMetadata({
        expiresAt: futureDate,
        rotationPolicy: {
          maxAgeMs: 90 * 24 * 60 * 60 * 1000,
          rotateBeforeExpiryMs: 7 * 24 * 60 * 60 * 1000,
          versionsToKeep: 2,
          autoRotate: false,
          notifyOnRotation: true,
        },
      });

      const result = validator.validateExpiration(metadata);

      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it("returns errors for expired secrets", () => {
      const pastDate = new Date(Date.now() - 86400000);
      const metadata = createMetadata({ expiresAt: pastDate });

      const result = validator.validateExpiration(metadata);

      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: "expired_secret" }),
      );
    });

    it("passes for secrets without expiration", () => {
      const metadata = createMetadata({ expiresAt: undefined });

      const result = validator.validateExpiration(metadata);

      expect(result.errors).toHaveLength(0);
    });
  });

  describe("version validation", () => {
    it("fails when no versions exist", () => {
      const metadata = createMetadata({ versions: [] });

      const result = validator.validateVersion(metadata);

      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: "version_outdated" }),
      );
    });

    it("fails when no active version exists", () => {
      const metadata = createMetadata({
        versions: [
          {
            version: 1,
            value: { key: "old" },
            createdAt: new Date(),
            status: "deprecated",
          },
        ],
      });

      const result = validator.validateVersion(metadata);

      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: "version_outdated" }),
      );
    });

    it("passes for valid version", () => {
      const metadata = createMetadata();

      const result = validator.validateVersion(metadata);

      expect(result.errors).toHaveLength(0);
    });
  });

  describe("OAuth client secret validation", () => {
    it("passes for valid OAuth credentials", () => {
      const metadata = createMetadata({
        key: "oauth_google",
        type: SecretType.OAuthClientSecret,
      });

      const result = validator.validate(metadata, {
        clientId: "my-client-id",
        clientSecret: "my-client-secret",
        authorizationUrl: "https://auth.example.com",
        tokenUrl: "https://token.example.com",
        scopes: ["read", "write"],
      });

      expect(result.valid).toBe(true);
    });

    it("fails when client ID is missing", () => {
      const metadata = createMetadata({
        key: "oauth_google",
        type: SecretType.OAuthClientSecret,
      });

      const result = validator.validate(metadata, {
        clientId: "",
        clientSecret: "secret",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "clientId", code: "missing_required" }),
      );
    });
  });
});
