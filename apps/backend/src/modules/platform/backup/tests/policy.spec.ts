import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { BackupPolicy } from "../BackupPolicy.js";
import type { BackupPolicyConfig } from "../types.js";

describe("BackupPolicy", () => {
  let policy: BackupPolicy;

  beforeEach(() => {
    policy = new BackupPolicy();
  });

  const validConfig: BackupPolicyConfig = {
    retentionPeriodMs: 86400000,
    maxVersions: 10,
    compression: "none",
    encryption: "none",
    verifyAfterBackup: true,
    storageBucket: "backups",
    storagePolicy: "private",
  };

  describe("validate", () => {
    it("returns valid for a correct config", () => {
      const result = policy.validate(validConfig);
      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });

    it("rejects zero retention period", () => {
      const result = policy.validate({ ...validConfig, retentionPeriodMs: 0 });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("Retention period")));
    });

    it("rejects negative retention period", () => {
      const result = policy.validate({ ...validConfig, retentionPeriodMs: -1 });
      assert.equal(result.valid, false);
    });

    it("rejects zero max versions", () => {
      const result = policy.validate({ ...validConfig, maxVersions: 0 });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("Max versions")));
    });

    it("rejects empty storage bucket", () => {
      const result = policy.validate({ ...validConfig, storageBucket: "" });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("Storage bucket")));
    });

    it("rejects empty storage policy", () => {
      const result = policy.validate({ ...validConfig, storagePolicy: "" });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("Storage policy")));
    });

    it("collects multiple errors", () => {
      const result = policy.validate({
        ...validConfig,
        retentionPeriodMs: 0,
        maxVersions: 0,
        storageBucket: "",
        storagePolicy: "",
      });
      assert.equal(result.valid, false);
      assert.equal(result.errors.length, 4);
    });
  });

  describe("checkRetention", () => {
    it("allows backup when under max versions", () => {
      const result = policy.checkRetention(validConfig, 5, 1000);
      assert.equal(result.allowed, true);
    });

    it("blocks backup when at max versions", () => {
      const result = policy.checkRetention(validConfig, 10, 1000);
      assert.equal(result.allowed, false);
      assert.ok(result.reason.includes("Max versions"));
      assert.equal(result.expiredCount, 1);
    });

    it("blocks backup when over max versions", () => {
      const result = policy.checkRetention(validConfig, 15, 1000);
      assert.equal(result.allowed, false);
      assert.equal(result.expiredCount, 6);
    });
  });

  describe("isExpired", () => {
    it("returns true when age exceeds retention period", () => {
      assert.equal(policy.isExpired(validConfig, 86400001), true);
    });

    it("returns false when age is less than retention period", () => {
      assert.equal(policy.isExpired(validConfig, 86399999), false);
    });

    it("returns true when age equals retention period", () => {
      assert.equal(policy.isExpired(validConfig, 86400000), true);
    });
  });

  describe("shouldVerify", () => {
    it("returns true when verifyAfterBackup is true", () => {
      assert.equal(policy.shouldVerify({ ...validConfig, verifyAfterBackup: true }), true);
    });

    it("returns false when verifyAfterBackup is false", () => {
      assert.equal(policy.shouldVerify({ ...validConfig, verifyAfterBackup: false }), false);
    });
  });

  describe("getDefaultExpiry", () => {
    it("returns a date in the future based on retention", () => {
      const expiry = policy.getDefaultExpiry(validConfig);
      const expected = Date.now() + 86400000;
      assert.ok(Math.abs(expiry.getTime() - expected) < 100);
    });
  });

  describe("supportsBackupType", () => {
    it("supports full", () => {
      assert.equal(policy.supportsBackupType("full"), true);
    });

    it("supports incremental", () => {
      assert.equal(policy.supportsBackupType("incremental"), true);
    });

    it("supports differential", () => {
      assert.equal(policy.supportsBackupType("differential"), true);
    });

    it("supports snapshot", () => {
      assert.equal(policy.supportsBackupType("snapshot"), true);
    });
  });
});
