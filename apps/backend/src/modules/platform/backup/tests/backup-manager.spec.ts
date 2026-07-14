import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { BackupManager } from "../BackupManager.js";
import { BackupMetadata } from "../BackupMetadata.js";
import { BackupPolicy } from "../BackupPolicy.js";
import type { BackupPolicyConfig, StorageProvider, BackupDataEntry } from "../types.js";

const defaultPolicy: BackupPolicyConfig = {
  retentionPeriodMs: 86400000,
  maxVersions: 10,
  compression: "none",
  encryption: "none",
  verifyAfterBackup: false,
  storageBucket: "backups",
  storagePolicy: "private",
};

function createMockStorage(downloadContent?: string): StorageProvider {
  return {
    upload: mock.fn(async (req) => ({
      id: "st-1",
      path: "backups/test/bkp-1.json",
      bucket: "backups",
      version: "v1",
      checksum: "abc123",
      contentLength: req?.content?.length ?? 0,
      createdAt: new Date(),
    })),
    download: mock.fn(async () => ({
      id: "st-1",
      path: "backups/test/bkp-1.json",
      bucket: "backups",
      content: downloadContent ?? JSON.stringify({ checksum: "abc123", entries: [{ key: "db", content: "{}" }] }),
      contentType: "application/json",
      contentLength: 100,
      metadata: {},
    })),
    delete: mock.fn(async () => ({
      path: "backups/test/bkp-1.json",
      bucket: "backups",
      deleted: true,
      permanent: false,
      deletedAt: new Date(),
    })),
    move: mock.fn(),
    copy: mock.fn(),
    exists: mock.fn(),
    list: mock.fn(),
    generateSignedUrl: mock.fn(),
    getObject: mock.fn(),
  };
}

describe("BackupManager", () => {
  let manager: BackupManager;
  let metadata: BackupMetadata;
  let policy: BackupPolicy;
  let storage: StorageProvider;

  beforeEach(() => {
    metadata = new BackupMetadata();
    policy = new BackupPolicy();
    storage = createMockStorage();
    manager = new BackupManager(metadata, policy, storage);
  });

  const entries: BackupDataEntry[] = [
    { key: "users", content: JSON.stringify([{ id: 1, name: "Alice" }]), contentType: "application/json" },
    { key: "orders", content: JSON.stringify([{ id: 101, total: 50 }]), contentType: "application/json" },
  ];

  describe("createBackup", () => {
    it("creates a full backup successfully", async () => {
      const result = await manager.createBackup("nightly", "full", entries, defaultPolicy);
      assert.equal(result.status, "completed");
      assert.equal(result.name, "nightly");
      assert.equal(result.type, "full");
      assert.ok(result.backupId);
      assert.ok(result.durationMs >= 0);
    });

    it("stores backup in metadata", async () => {
      await manager.createBackup("store-test", "full", entries, defaultPolicy);
      const allBackups = metadata.list();
      assert.equal(allBackups.length, 1);
      assert.equal(allBackups[0].name, "store-test");
    });

    it("uploads to storage when provider is available", async () => {
      await manager.createBackup("storage-test", "full", entries, defaultPolicy);
      assert.equal((storage.upload as ReturnType<typeof mock.fn>).mock.callCount(), 1);
    });

    it("returns failed when policy is invalid", async () => {
      const badPolicy = { ...defaultPolicy, retentionPeriodMs: 0 };
      const result = await manager.createBackup("bad-policy", "full", entries, badPolicy);
      assert.equal(result.status, "failed");
      assert.ok(result.error?.includes("Invalid policy"));
    });

    it("creates snapshot backup successfully (prepared)", async () => {
      const result = await manager.createBackup("snapshot-test", "snapshot", entries, defaultPolicy);
      assert.equal(result.status, "completed");
      assert.equal(result.type, "snapshot");
    });

    it("creates incremental backup successfully", async () => {
      const result = await manager.createBackup("incr-test", "incremental", entries, defaultPolicy);
      assert.equal(result.status, "completed");
      assert.equal(result.type, "incremental");
    });

    it("creates differential backup successfully", async () => {
      const result = await manager.createBackup("diff-test", "differential", entries, defaultPolicy);
      assert.equal(result.status, "completed");
      assert.equal(result.type, "differential");
    });

    it("returns failed when storage upload throws", async () => {
      const failingStorage: StorageProvider = {
        upload: mock.fn(async () => { throw new Error("Storage full"); }),
        download: mock.fn(),
        delete: mock.fn(),
        move: mock.fn(),
        copy: mock.fn(),
        exists: mock.fn(),
        list: mock.fn(),
        generateSignedUrl: mock.fn(),
        getObject: mock.fn(),
      };
      const badManager = new BackupManager(metadata, policy, failingStorage);
      const result = await badManager.createBackup("fail-storage", "full", entries, defaultPolicy);
      assert.equal(result.status, "failed");
      assert.equal(result.error, "Storage full");
    });

    it("computes checksum from entry contents", async () => {
      const result = await manager.createBackup("checksum-test", "full", entries, defaultPolicy);
      assert.ok(result.checksum);
      assert.equal(result.checksum!.length, 8);
    });

    it("tracks size bytes", async () => {
      const result = await manager.createBackup("size-test", "full", entries, defaultPolicy);
      const totalSize = entries.reduce((s, e) => s + e.content.length, 0);
      assert.equal(result.sizeBytes, totalSize);
    });

    it("accepts tags and metadata", async () => {
      const result = await manager.createBackup("tags-test", "full", entries, defaultPolicy, {
        tags: ["critical", "production"],
        metadata: { env: "prod" },
      });
      assert.equal(result.status, "completed");
      const backup = metadata.get(result.backupId);
      assert.ok(backup!.tags.includes("critical"));
      assert.equal(backup!.metadata["env"], "prod");
    });

    it("creates backup without storage provider", async () => {
      const localManager = new BackupManager(metadata, policy);
      const result = await localManager.createBackup("local", "full", entries, defaultPolicy);
      assert.equal(result.status, "completed");
      assert.equal(result.storagePath, undefined);
    });
  });

  describe("verifyBackup", () => {
    it("verifies a completed backup successfully", async () => {
      const combinedContent = entries.map((e) => e.content).join("");
      const hash = Math.abs(
        combinedContent.split("").reduce((h, c) => ((h << 5) + h + c.charCodeAt(0)) | 0, 5381),
      ).toString(16).padStart(8, "0");

      const matchingStorage = createMockStorage(
        JSON.stringify({ checksum: hash, entries }),
      );
      const goodManager = new BackupManager(metadata, policy, matchingStorage);
      await goodManager.createBackup("verify-me", "full", entries, defaultPolicy);

      const backup = metadata.list()[0];
      backup.state = "completed";
      metadata.update(backup);
      const result = await goodManager.verifyBackup(backup.id);
      assert.equal(result.status, "verified");
      assert.equal(result.verified, true);
    });

    it("throws for non-existent backup", async () => {
      await assert.rejects(
        () => manager.verifyBackup("nope"),
        /not found/,
      );
    });

    it("throws for non-completed backup", async () => {
      const backup = {
        id: "bkp-fail",
        name: "fail",
        type: "full" as const,
        state: "running" as const,
        policy: defaultPolicy,
        data: entries,
        triggeredAt: new Date(),
        expiresAt: new Date(),
        tags: [],
        metadata: {},
      };
      metadata.add(backup);
      await assert.rejects(
        () => manager.verifyBackup("bkp-fail"),
        /Cannot transition/,
      );
    });

    it("detects checksum mismatch during verification", async () => {
      const corruptStorage: StorageProvider = {
        upload: mock.fn(async () => ({
          id: "st-1",
          path: "backups/test/bkp-1.json",
          bucket: "backups",
          version: "v1",
          checksum: "abc123",
          contentLength: 50,
          createdAt: new Date(),
        })),
        download: mock.fn(async () => ({
          id: "st-1",
          path: "backups/test/bkp-1.json",
          bucket: "backups",
          content: JSON.stringify({ checksum: "deadbeef", entries: [] }),
          contentType: "application/json",
          contentLength: 50,
          metadata: {},
        })),
        delete: mock.fn(),
        move: mock.fn(),
        copy: mock.fn(),
        exists: mock.fn(),
        list: mock.fn(),
        generateSignedUrl: mock.fn(),
        getObject: mock.fn(),
      };
      const badManager = new BackupManager(metadata, policy, corruptStorage);
      await badManager.createBackup("corrupt-check", "full", entries, defaultPolicy);
      const backup = metadata.list()[0];
      backup.state = "completed";
      metadata.update(backup);
      const result = await badManager.verifyBackup(backup.id);
      assert.equal(result.status, "failed");
      assert.ok(result.error!.includes("Checksum mismatch"));
    });
  });

  describe("expireBackups", () => {
    it("expires backups past retention period", async () => {
      const oldBackup = {
        id: "bkp-old",
        name: "old-backup",
        type: "full" as const,
        state: "completed" as const,
        policy: defaultPolicy,
        data: entries,
        triggeredAt: new Date(Date.now() - 2 * 86400000),
        expiresAt: new Date(Date.now() - 86400000),
        tags: [],
        metadata: {},
      };
      metadata.add(oldBackup);
      const recentBackup = {
        id: "bkp-recent",
        name: "recent-backup",
        type: "full" as const,
        state: "completed" as const,
        policy: defaultPolicy,
        data: entries,
        triggeredAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        tags: [],
        metadata: {},
      };
      metadata.add(recentBackup);
      const expired = await manager.expireBackups();
      assert.equal(expired, 1);
      assert.equal(metadata.get("bkp-old")!.state, "expired");
      assert.equal(metadata.get("bkp-recent")!.state, "completed");
    });

    it("does not double-expire already expired backups", async () => {
      const backup = {
        id: "bkp-double",
        name: "double",
        type: "full" as const,
        state: "expired" as const,
        policy: defaultPolicy,
        data: entries,
        triggeredAt: new Date(Date.now() - 2 * 86400000),
        expiresAt: new Date(Date.now() - 86400000),
        tags: [],
        metadata: {},
      };
      metadata.add(backup);
      const expired = await manager.expireBackups();
      assert.equal(expired, 0);
    });
  });

  describe("deleteBackup", () => {
    it("deletes a backup and returns true", async () => {
      const backup = {
        id: "bkp-del",
        name: "delete-me",
        type: "full" as const,
        state: "completed" as const,
        policy: defaultPolicy,
        data: entries,
        triggeredAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        tags: [],
        metadata: {},
      };
      metadata.add(backup);
      assert.equal(await manager.deleteBackup("bkp-del"), true);
      assert.equal(metadata.get("bkp-del"), null);
    });

    it("returns false for non-existent backup", async () => {
      assert.equal(await manager.deleteBackup("nope"), false);
    });

    it("deletes storage when path is available", async () => {
      const backup = {
        id: "bkp-storagedel",
        name: "storage-del",
        type: "full" as const,
        state: "completed" as const,
        policy: defaultPolicy,
        data: entries,
        triggeredAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        storagePath: "backups/storage-del/bkp-storagedel.json",
        storageBucket: "backups",
        tags: [],
        metadata: {},
      };
      metadata.add(backup);
      await manager.deleteBackup("bkp-storagedel");
      assert.equal((storage.delete as ReturnType<typeof mock.fn>).mock.callCount(), 1);
    });
  });
});
