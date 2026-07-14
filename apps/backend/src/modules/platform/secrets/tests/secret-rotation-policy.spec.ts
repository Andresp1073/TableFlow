import { describe, it, expect } from "vitest";
import {
  createDefaultRotationPolicy,
  computeRotationStatus,
  shouldRotate,
  isRotationAllowed,
  requiresApproval,
} from "../SecretRotationPolicy.js";
import { SecretType } from "../types.js";
import type { SecretMetadata } from "../types.js";

describe("SecretRotationPolicy", () => {
  describe("createDefaultRotationPolicy", () => {
    it("creates policy with default values", () => {
      const policy = createDefaultRotationPolicy();

      expect(policy.maxAgeMs).toBe(90 * 24 * 60 * 60 * 1000);
      expect(policy.rotateBeforeExpiryMs).toBe(7 * 24 * 60 * 60 * 1000);
      expect(policy.versionsToKeep).toBe(2);
      expect(policy.autoRotate).toBe(false);
      expect(policy.notifyOnRotation).toBe(true);
    });

    it("merges overrides with defaults", () => {
      const policy = createDefaultRotationPolicy({ autoRotate: true, versionsToKeep: 5 });

      expect(policy.autoRotate).toBe(true);
      expect(policy.versionsToKeep).toBe(5);
      expect(policy.maxAgeMs).toBe(90 * 24 * 60 * 60 * 1000);
    });
  });

  describe("computeRotationStatus", () => {
    function createMetadata(overrides: Partial<SecretMetadata> = {}): SecretMetadata {
      return {
        id: "test_1",
        key: "api_test",
        type: SecretType.ApiKey,
        name: "Test Key",
        currentVersion: 1,
        versions: [
          {
            version: 1,
            value: { key: "sk-key" },
            createdAt: new Date(),
            status: "active",
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    }

    it("returns ok status for valid secret without expiry", () => {
      const metadata = createMetadata();
      const policy = createDefaultRotationPolicy();

      const status = computeRotationStatus("api_test", metadata, policy);

      expect(status.status).toBe("ok");
      expect(status.secretKey).toBe("api_test");
      expect(status.currentVersion).toBe(1);
    });

    it("returns expired status for expired secret", () => {
      const metadata = createMetadata({
        expiresAt: new Date(Date.now() - 86400000),
      });
      const policy = createDefaultRotationPolicy();

      const status = computeRotationStatus("api_test", metadata, policy);

      expect(status.status).toBe("expired");
      expect(status.daysUntilExpiry).toBeLessThanOrEqual(0);
    });

    it("returns expiring_soon status when within rotateBeforeExpiry", () => {
      const metadata = createMetadata({
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });
      const policy = createDefaultRotationPolicy({ rotateBeforeExpiryMs: 7 * 24 * 60 * 60 * 1000 });

      const status = computeRotationStatus("api_test", metadata, policy);

      expect(status.status).toBe("expiring_soon");
    });

    it("returns rotation_required when version exceeds max age", () => {
      const oldDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
      const metadata = createMetadata({
        versions: [
          {
            version: 1,
            value: { key: "old-key" },
            createdAt: oldDate,
            status: "active",
          },
        ],
      });
      const policy = createDefaultRotationPolicy();

      const status = computeRotationStatus("api_test", metadata, policy);

      expect(status.status).toBe("rotation_required");
    });
  });

  describe("shouldRotate", () => {
    const policy = createDefaultRotationPolicy();

    it("returns true for expired status", () => {
      const status = {
        secretKey: "test",
        currentVersion: 1,
        expiresAt: null,
        lastRotatedAt: null,
        status: "expired" as const,
        daysUntilExpiry: -1,
        policy,
      };

      expect(shouldRotate(status)).toBe(true);
    });

    it("returns true for compromised status", () => {
      const status = {
        secretKey: "test",
        currentVersion: 1,
        expiresAt: null,
        lastRotatedAt: null,
        status: "compromised" as const,
        daysUntilExpiry: null,
        policy,
      };

      expect(shouldRotate(status)).toBe(true);
    });

    it("returns false for ok status", () => {
      const status = {
        secretKey: "test",
        currentVersion: 1,
        expiresAt: null,
        lastRotatedAt: null,
        status: "ok" as const,
        daysUntilExpiry: null,
        policy,
      };

      expect(shouldRotate(status)).toBe(false);
    });
  });

  describe("isRotationAllowed", () => {
    it("returns false when autoRotate is off and not compromised", () => {
      const policy = createDefaultRotationPolicy({ autoRotate: false });
      const status = {
        secretKey: "test",
        currentVersion: 1,
        expiresAt: null,
        lastRotatedAt: null,
        status: "expiring_soon" as const,
        daysUntilExpiry: 3,
        policy,
      };

      expect(isRotationAllowed(status)).toBe(false);
    });

    it("returns true when compromised even if autoRotate is off", () => {
      const policy = createDefaultRotationPolicy({ autoRotate: false });
      const status = {
        secretKey: "test",
        currentVersion: 1,
        expiresAt: null,
        lastRotatedAt: null,
        status: "compromised" as const,
        daysUntilExpiry: null,
        policy,
      };

      expect(isRotationAllowed(status)).toBe(true);
    });

    it("returns true when autoRotate is on", () => {
      const policy = createDefaultRotationPolicy({ autoRotate: true });
      const status = {
        secretKey: "test",
        currentVersion: 1,
        expiresAt: null,
        lastRotatedAt: null,
        status: "expiring_soon" as const,
        daysUntilExpiry: 3,
        policy,
      };

      expect(isRotationAllowed(status)).toBe(true);
    });
  });

  describe("requiresApproval", () => {
    it("returns true when requireApproval is set and not compromised", () => {
      const policy = createDefaultRotationPolicy({ requireApproval: true });
      const status = {
        secretKey: "test",
        currentVersion: 1,
        expiresAt: null,
        lastRotatedAt: null,
        status: "rotation_required" as const,
        daysUntilExpiry: null,
        policy,
      };

      expect(requiresApproval(status)).toBe(true);
    });

    it("returns false when compromised even if requireApproval is set", () => {
      const policy = createDefaultRotationPolicy({ requireApproval: true });
      const status = {
        secretKey: "test",
        currentVersion: 1,
        expiresAt: null,
        lastRotatedAt: null,
        status: "compromised" as const,
        daysUntilExpiry: null,
        policy,
      };

      expect(requiresApproval(status)).toBe(false);
    });

    it("returns false when requireApproval is not set", () => {
      const policy = createDefaultRotationPolicy();
      const status = {
        secretKey: "test",
        currentVersion: 1,
        expiresAt: null,
        lastRotatedAt: null,
        status: "rotation_required" as const,
        daysUntilExpiry: null,
        policy,
      };

      expect(requiresApproval(status)).toBe(false);
    });
  });
});
