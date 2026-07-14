import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { RestoreManager } from "../RestoreManager.js";
import { BackupMetadata } from "../BackupMetadata.js";
import type { Backup, BackupPolicyConfig, StorageProvider, RestoreOptions } from "../types.js";

const defaultPolicy: BackupPolicyConfig = {
  retentionPeriodMs: 86400000,
  maxVersions: 10,
  compression: "none",
  encryption: "none",
  verifyAfterBackup: false,
  storageBucket: "backups",
  storagePolicy: "private",
};

function createTestBackup(overrides: Partial<Backup> = {}): Backup {
  return {
    id: "bkp-restore-1",
    name: "test-backup",
    type: "full",
    state: "completed",
    policy: defaultPolicy,
    data: [
      { key: "users", content: '[{"id":1}]', contentType: "application/json" },
      { key: "orders", content: '[{"id":101}]', contentType: "application/json" },
      { key: "products", content: '[{"id":201}]', contentType: "application/json" },
    ],
    triggeredAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    tags: [],
    metadata: {},
    ...overrides,
  };
}

function createMockStorage(): StorageProvider {
  return {
    upload: mock.fn(async () => ({
      id: "st-u1",
      path: "restore/test/key.json",
      bucket: "backups",
      version: "v1",
      checksum: "abc",
      contentLength: 10,
      createdAt: new Date(),
    })),
    download: mock.fn(),
    delete: mock.fn(),
    move: mock.fn(),
    copy: mock.fn(),
    exists: mock.fn(),
    list: mock.fn(),
    generateSignedUrl: mock.fn(),
    getObject: mock.fn(),
  };
}

describe("RestoreManager", () => {
  let restoreManager: RestoreManager;
  let metadata: BackupMetadata;
  let storage: StorageProvider;

  beforeEach(() => {
    metadata = new BackupMetadata();
    storage = createMockStorage();
    restoreManager = new RestoreManager(metadata, storage);
  });

  it("restores a full backup", async () => {
    metadata.add(createTestBackup({ id: "bkp-full" }));
    const result = await restoreManager.restore("bkp-full", "full");
    assert.equal(result.status, "completed");
    assert.equal(result.entriesRestored, 3);
    assert.equal(result.entriesFailed, 0);
    assert.equal(result.backupId, "bkp-full");
    assert.ok(result.restoreId.startsWith("rr_"));
  });

  it("restores a full backup without storage provider", async () => {
    const localRestore = new RestoreManager(metadata);
    metadata.add(createTestBackup({ id: "bkp-local" }));
    const result = await localRestore.restore("bkp-local", "full");
    assert.equal(result.status, "completed");
    assert.equal(result.entriesRestored, 3);
  });

  it("performs selective restore with specific keys", async () => {
    metadata.add(createTestBackup({ id: "bkp-selective" }));
    const options: RestoreOptions = { entries: ["users", "orders"] };
    const result = await restoreManager.restore("bkp-selective", "selective", options);
    assert.equal(result.status, "completed");
    assert.equal(result.entriesRestored, 2);
  });

  it("performs selective restore of all entries when no keys specified", async () => {
    metadata.add(createTestBackup({ id: "bkp-sel-all" }));
    const result = await restoreManager.restore("bkp-sel-all", "selective");
    assert.equal(result.status, "completed");
    assert.equal(result.entriesRestored, 3);
  });

  it("performs version restore", async () => {
    metadata.add(createTestBackup({ id: "bkp-ver" }));
    const result = await restoreManager.restore("bkp-ver", "version");
    assert.equal(result.status, "completed");
    assert.equal(result.entriesRestored, 3);
  });

  it("performs point-in-time restore", async () => {
    metadata.add(createTestBackup({ id: "bkp-pit" }));
    const result = await restoreManager.restore("bkp-pit", "point-in-time");
    assert.equal(result.status, "completed");
    assert.equal(result.entriesRestored, 3);
  });

  it("restores to custom destination bucket and path", async () => {
    metadata.add(createTestBackup({ id: "bkp-dest" }));
    const options: RestoreOptions = {
      destinationBucket: "restore-bucket",
      destinationPath: "custom/restore/path",
    };
    const result = await restoreManager.restore("bkp-dest", "full", options);
    assert.equal(result.status, "completed");
    assert.equal(result.destinationBucket, "restore-bucket");
    assert.equal(result.destinationPath, "custom/restore/path");
  });

  it("throws for non-existent backup", async () => {
    await assert.rejects(
      () => restoreManager.restore("nope", "full"),
      /not found/,
    );
  });

  it("returns failed when storage upload fails", async () => {
    const failingStorage: StorageProvider = {
      upload: mock.fn(async () => { throw new Error("Upload denied"); }),
      download: mock.fn(),
      delete: mock.fn(),
      move: mock.fn(),
      copy: mock.fn(),
      exists: mock.fn(),
      list: mock.fn(),
      generateSignedUrl: mock.fn(),
      getObject: mock.fn(),
    };
    const failingRestore = new RestoreManager(metadata, failingStorage);
    metadata.add(createTestBackup({ id: "bkp-fail" }));
    const result = await failingRestore.restore("bkp-fail", "full");
    assert.equal(result.status, "failed");
    assert.equal(result.entriesFailed, 3);
    assert.equal(result.failedEntries.length, 3);
  });

  it("reports partial restore when some entries fail", async () => {
    let callCount = 0;
    const partialStorage: StorageProvider = {
      upload: mock.fn(async () => {
        callCount++;
        if (callCount === 2) {
          throw new Error("Failed on second entry");
        }
        return {
          id: "st-p1",
          path: "restore/test/key.json",
          bucket: "backups",
          version: "v1",
          checksum: "abc",
          contentLength: 10,
          createdAt: new Date(),
        };
      }),
      download: mock.fn(),
      delete: mock.fn(),
      move: mock.fn(),
      copy: mock.fn(),
      exists: mock.fn(),
      list: mock.fn(),
      generateSignedUrl: mock.fn(),
      getObject: mock.fn(),
    };
    const partialRestore = new RestoreManager(metadata, partialStorage);
    metadata.add(createTestBackup({ id: "bkp-partial" }));
    const result = await partialRestore.restore("bkp-partial", "full");
    assert.equal(result.status, "partial");
    assert.equal(result.entriesRestored, 2);
    assert.equal(result.entriesFailed, 1);
    assert.equal(result.failedEntries.length, 1);
  });

  it("returns empty restore for backup with no entries", async () => {
    metadata.add(createTestBackup({ id: "bkp-empty", data: [] }));
    const result = await restoreManager.restore("bkp-empty", "full");
    assert.equal(result.status, "completed");
    assert.equal(result.entriesRestored, 0);
  });
});
