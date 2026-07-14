import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { BackupMetadata } from "../BackupMetadata.js";
import type { Backup, BackupPolicyConfig } from "../types.js";

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
    id: `bkp-${Math.random().toString(36).slice(2, 6)}`,
    name: `test-${Math.random().toString(36).slice(2, 6)}`,
    type: "full",
    state: "completed",
    policy: defaultPolicy,
    data: [{ key: "db", content: "{}", contentType: "application/json" }],
    triggeredAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    tags: [],
    metadata: {},
    ...overrides,
  };
}

describe("BackupMetadata", () => {
  let metadata: BackupMetadata;

  beforeEach(() => {
    metadata = new BackupMetadata();
  });

  it("adds a backup and retrieves by id", () => {
    const backup = createTestBackup({ id: "bkp-001" });
    metadata.add(backup);
    assert.notEqual(metadata.get("bkp-001"), null);
    assert.equal(metadata.get("bkp-001")!.id, "bkp-001");
  });

  it("returns null for non-existent backup", () => {
    assert.equal(metadata.get("nope"), null);
  });

  it("returns null for non-existent metadata", () => {
    assert.equal(metadata.getMetadata("nope"), null);
  });

  it("returns metadata data for existing backup", () => {
    const backup = createTestBackup({ id: "bkp-002", name: "nightly" });
    metadata.add(backup);
    const meta = metadata.getMetadata("bkp-002");
    assert.notEqual(meta, null);
    assert.equal(meta!.name, "nightly");
    assert.equal(meta!.backupId, "bkp-002");
  });

  it("updates an existing backup", () => {
    const backup = createTestBackup({ id: "bkp-003", state: "running" });
    metadata.add(backup);
    backup.state = "completed";
    metadata.update(backup);
    assert.equal(metadata.get("bkp-003")!.state, "completed");
  });

  it("removes a backup", () => {
    const backup = createTestBackup({ id: "bkp-004" });
    metadata.add(backup);
    assert.equal(metadata.remove("bkp-004"), true);
    assert.equal(metadata.get("bkp-004"), null);
  });

  it("returns false when removing non-existent backup", () => {
    assert.equal(metadata.remove("nope"), false);
  });

  it("lists backups sorted by triggeredAt descending", () => {
    const old = createTestBackup({ id: "b1", triggeredAt: new Date(Date.now() - 10000) });
    const mid = createTestBackup({ id: "b2", triggeredAt: new Date(Date.now() - 5000) });
    const recent = createTestBackup({ id: "b3", triggeredAt: new Date() });
    metadata.add(old);
    metadata.add(mid);
    metadata.add(recent);
    const list = metadata.list();
    assert.equal(list.length, 3);
    assert.equal(list[0].id, "b3");
    assert.equal(list[1].id, "b2");
    assert.equal(list[2].id, "b1");
  });

  it("filters by name", () => {
    metadata.add(createTestBackup({ id: "a", name: "daily" }));
    metadata.add(createTestBackup({ id: "b", name: "weekly" }));
    assert.equal(metadata.list({ name: "daily" }).length, 1);
  });

  it("filters by type", () => {
    metadata.add(createTestBackup({ id: "a", type: "full" }));
    metadata.add(createTestBackup({ id: "b", type: "incremental" }));
    assert.equal(metadata.list({ type: "full" }).length, 1);
  });

  it("filters by state", () => {
    metadata.add(createTestBackup({ id: "a", state: "completed" }));
    metadata.add(createTestBackup({ id: "b", state: "failed" }));
    assert.equal(metadata.list({ state: "completed" }).length, 1);
  });

  it("filters by tags", () => {
    metadata.add(createTestBackup({ id: "a", tags: ["critical"] }));
    metadata.add(createTestBackup({ id: "b", tags: ["archive"] }));
    assert.equal(metadata.list({ tags: ["critical"] }).length, 1);
  });

  it("filters by date range", () => {
    const now = Date.now();
    metadata.add(createTestBackup({ id: "a", triggeredAt: new Date(now - 10000) }));
    metadata.add(createTestBackup({ id: "b", triggeredAt: new Date(now) }));
    assert.equal(metadata.list({ createdAfter: new Date(now - 5000) }).length, 1);
    assert.equal(metadata.list({ createdBefore: new Date(now - 5000) }).length, 1);
  });

  it("filters by parentBackupId", () => {
    metadata.add(createTestBackup({ id: "a", parentBackupId: "parent-1" }));
    metadata.add(createTestBackup({ id: "b", parentBackupId: "parent-2" }));
    assert.equal(metadata.list({ parentBackupId: "parent-1" }).length, 1);
  });

  it("counts backups", () => {
    assert.equal(metadata.count(), 0);
    metadata.add(createTestBackup({ id: "a" }));
    assert.equal(metadata.count(), 1);
    metadata.add(createTestBackup({ id: "b" }));
    assert.equal(metadata.count(), 2);
  });

  it("counts with filter", () => {
    metadata.add(createTestBackup({ id: "a", type: "full" }));
    metadata.add(createTestBackup({ id: "b", type: "incremental" }));
    assert.equal(metadata.count({ type: "full" }), 1);
  });

  it("clears all backups", () => {
    metadata.add(createTestBackup({ id: "a" }));
    metadata.add(createTestBackup({ id: "b" }));
    metadata.clear();
    assert.equal(metadata.count(), 0);
  });
});
