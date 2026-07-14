import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { BackupCoordinator } from "../BackupCoordinator.js";
import { BackupManager } from "../BackupManager.js";
import { RestoreManager } from "../RestoreManager.js";
import { BackupMetadata } from "../BackupMetadata.js";
import { BackupPolicy } from "../BackupPolicy.js";
import type { BackupPolicyConfig, StorageProvider, BackupDataEntry, Backup } from "../types.js";
import type { Scheduler, ScheduleTriggerConfig } from "../../scheduler/types.js";

const defaultPolicy: BackupPolicyConfig = {
  retentionPeriodMs: 86400000,
  maxVersions: 10,
  compression: "none",
  encryption: "none",
  verifyAfterBackup: false,
  storageBucket: "backups",
  storagePolicy: "private",
};

function createMockStorage(): StorageProvider {
  let sequence = 0;
  return {
    upload: mock.fn(async (req) => {
      sequence++;
      return {
        id: `st-${sequence}`,
        path: req.path,
        bucket: req.bucket ?? "backups",
        version: `v${sequence}`,
        checksum: "abc123",
        contentLength: req.content?.length ?? 0,
        createdAt: new Date(),
      };
    }),
    download: mock.fn(async () => ({
      id: "st-d1",
      path: "backups/test/bkp-1.json",
      bucket: "backups",
      content: JSON.stringify({ checksum: "abc123", entries: [{ key: "db", content: "{}" }] }),
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

describe("Backup Integration", () => {
  let coordinator: BackupCoordinator;
  let metadata: BackupMetadata;
  let storage: StorageProvider;
  let backupManager: BackupManager;
  let restoreManager: RestoreManager;
  let policy: BackupPolicy;

  beforeEach(() => {
    metadata = new BackupMetadata();
    policy = new BackupPolicy();
    storage = createMockStorage();
    backupManager = new BackupManager(metadata, policy, storage);
    restoreManager = new RestoreManager(metadata, storage);
    coordinator = new BackupCoordinator(backupManager, restoreManager, metadata, policy);
  });

  const entries: BackupDataEntry[] = [
    { key: "users", content: JSON.stringify([{ id: 1, name: "Alice" }]) },
    { key: "orders", content: JSON.stringify([{ id: 101, total: 50 }]) },
  ];

  it("creates and verifies a full backup", async () => {
    const createResult = await coordinator.createBackup("nightly", "full", entries, defaultPolicy);
    assert.equal(createResult.status, "completed");

    const backup = await coordinator.getBackup(createResult.backupId);
    assert.notEqual(backup, null);
    assert.equal(backup!.name, "nightly");
    assert.equal(backup!.state, "completed");

    const meta = await coordinator.getBackupMetadata(createResult.backupId);
    assert.notEqual(meta, null);
    assert.equal(meta!.name, "nightly");
  });

  it("lists backups with filtering", async () => {
    await coordinator.createBackup("daily", "full", entries, defaultPolicy, { tags: ["daily"] });
    await coordinator.createBackup("weekly", "full", entries, { ...defaultPolicy, retentionPeriodMs: 604800000 }, { tags: ["weekly"] });

    const all = await coordinator.listBackups();
    assert.equal(all.length, 2);

    const daily = await coordinator.listBackups({ name: "daily" });
    assert.equal(daily.length, 1);
  });

  it("creates and restores a backup", async () => {
    const createResult = await coordinator.createBackup("restore-cycle", "full", entries, defaultPolicy);
    assert.equal(createResult.status, "completed");

    const restoreResult = await coordinator.restoreBackup(createResult.backupId, "full");
    assert.equal(restoreResult.status, "completed");
    assert.equal(restoreResult.entriesRestored, 2);
  });

  it("performs selective restore from backup", async () => {
    const createResult = await coordinator.createBackup("selective-cycle", "full", entries, defaultPolicy);
    assert.equal(createResult.status, "completed");

    const restoreResult = await coordinator.restoreBackup(createResult.backupId, "selective", {
      entries: ["users"],
    });
    assert.equal(restoreResult.status, "completed");
    assert.equal(restoreResult.entriesRestored, 1);
  });

  it("verifies a completed backup", async () => {
    const combinedContent = entries.map((e) => e.content).join("");
    const hash = Math.abs(
      combinedContent.split("").reduce((h, c) => ((h << 5) + h + c.charCodeAt(0)) | 0, 5381),
    ).toString(16).padStart(8, "0");

    const matchingStorage: StorageProvider = {
      upload: mock.fn(async (req) => ({
        id: "st-1",
        path: req.path,
        bucket: req.bucket ?? "backups",
        version: "v1",
        checksum: hash,
        contentLength: req?.content?.length ?? 0,
        createdAt: new Date(),
      })),
      download: mock.fn(async () => ({
        id: "st-d1",
        path: "backups/verify-cycle/bkp-1.json",
        bucket: "backups",
        content: JSON.stringify({ checksum: hash, entries }),
        contentType: "application/json",
        contentLength: 100,
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

    const matchingManager = new BackupManager(metadata, policy, matchingStorage);
    const matchingRestore = new RestoreManager(metadata, matchingStorage);
    const verifyCoordinator = new BackupCoordinator(matchingManager, matchingRestore, metadata, policy);

    await verifyCoordinator.createBackup("verify-cycle", "full", entries, defaultPolicy);

    const all = await verifyCoordinator.listBackups();
    const backup = all[0];
    backup.state = "completed";
    metadata.update(backup);

    const verifyResult = await verifyCoordinator.verifyBackup(backup.id);
    assert.equal(verifyResult.status, "verified");
    assert.equal(verifyResult.verified, true);
  });

  it("deletes a backup and removes it from metadata", async () => {
    const createResult = await coordinator.createBackup("delete-cycle", "full", entries, defaultPolicy);
    assert.equal(createResult.status, "completed");

    const deleted = await coordinator.deleteBackup(createResult.backupId);
    assert.equal(deleted, true);

    const backup = await coordinator.getBackup(createResult.backupId);
    assert.equal(backup, null);
  });

  it("expires old backups", async () => {
    const oldBackup: Backup = {
      id: "expired-int-1",
      name: "old-backup",
      type: "full",
      state: "completed",
      policy: defaultPolicy,
      data: entries,
      triggeredAt: new Date(Date.now() - 2 * 86400000),
      expiresAt: new Date(Date.now() - 86400000),
      tags: [],
      metadata: {},
    };
    metadata.add(oldBackup);

    await coordinator.createBackup("fresh-backup", "full", entries, defaultPolicy);

    const expired = await coordinator.expireBackups();
    assert.equal(expired, 1);

    const expiredBackup = await coordinator.getBackup("expired-int-1");
    assert.equal(expiredBackup!.state, "expired");
  });

  it("creates a backup with parent reference for incremental chain", async () => {
    const fullResult = await coordinator.createBackup("base-full", "full", entries, defaultPolicy);
    assert.equal(fullResult.status, "completed");

    const incrEntries: BackupDataEntry[] = [
      { key: "users", content: JSON.stringify([{ id: 2, name: "Bob" }]) },
    ];

    const incrResult = await coordinator.createBackup(
      "incr-after-full",
      "incremental",
      incrEntries,
      defaultPolicy,
      { parentBackupId: fullResult.backupId },
    );
    assert.equal(incrResult.status, "completed");

    const incrBackup = await coordinator.getBackup(incrResult.backupId);
    assert.equal(incrBackup!.parentBackupId, fullResult.backupId);
  });

  it("registers a scheduled backup when scheduler is available", () => {
    const mockScheduler: Scheduler = {
      registerSchedule: mock.fn(),
      unregisterSchedule: mock.fn(),
      getSchedule: mock.fn(),
      listSchedules: mock.fn(),
      triggerSchedule: mock.fn(),
      pauseSchedule: mock.fn(),
      resumeSchedule: mock.fn(),
      enableSchedule: mock.fn(),
      disableSchedule: mock.fn(),
      checkSchedules: mock.fn(),
      setLogger: mock.fn(),
      setEventPublisher: mock.fn(),
      setJobScheduler: mock.fn(),
    };

    coordinator.setScheduler(mockScheduler);

    const trigger: ScheduleTriggerConfig = {
      type: "fixed-interval",
      id: "fi-backup",
      intervalMs: 86400000,
    };

    coordinator.registerScheduledBackup("nightly-backup", trigger, "full", defaultPolicy, {
      tags: ["automated"],
    });

    assert.equal((mockScheduler.registerSchedule as ReturnType<typeof mock.fn>).mock.callCount(), 1);
  });

  it("handles scheduler not configured for scheduled backups gracefully", () => {
    coordinator.registerScheduledBackup("unregistered-backup", { type: "manual", id: "m-bu" }, "full", defaultPolicy);
  });

  it("supports all backup types through coordinator", async () => {
    const full = await coordinator.createBackup("full-test", "full", entries, defaultPolicy);
    assert.equal(full.status, "completed");
    assert.equal(full.type, "full");

    const incr = await coordinator.createBackup("incr-test", "incremental", entries, defaultPolicy);
    assert.equal(incr.status, "completed");
    assert.equal(incr.type, "incremental");

    const diff = await coordinator.createBackup("diff-test", "differential", entries, defaultPolicy);
    assert.equal(diff.status, "completed");
    assert.equal(diff.type, "differential");
  });

  it("creates backup with verify after backup enabled", async () => {
    const combinedContent = entries.map((e) => e.content).join("");
    const hash = Math.abs(
      combinedContent.split("").reduce((h, c) => ((h << 5) + h + c.charCodeAt(0)) | 0, 5381),
    ).toString(16).padStart(8, "0");

    const verifyMetadata = new BackupMetadata();
    const matchingStorage: StorageProvider = {
      upload: mock.fn(async (req) => ({
        id: "st-1",
        path: req.path,
        bucket: req.bucket ?? "backups",
        version: "v1",
        checksum: hash,
        contentLength: req?.content?.length ?? 0,
        createdAt: new Date(),
      })),
      download: mock.fn(async () => ({
        id: "st-d1",
        path: "backups/auto-verify/bkp-1.json",
        bucket: "backups",
        content: JSON.stringify({ checksum: hash, entries }),
        contentType: "application/json",
        contentLength: 100,
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

    const verifyPolicy: BackupPolicyConfig = {
      ...defaultPolicy,
      verifyAfterBackup: true,
    };

    const vManager = new BackupManager(verifyMetadata, policy, matchingStorage);
    const vRestore = new RestoreManager(verifyMetadata, matchingStorage);
    const vCoordinator = new BackupCoordinator(vManager, vRestore, verifyMetadata, policy);

    const result = await vCoordinator.createBackup("auto-verify", "full", entries, verifyPolicy);
    assert.equal(result.status, "verified");
    assert.equal(result.verified, true);
  });
});
