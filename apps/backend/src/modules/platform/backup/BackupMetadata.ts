import type { Backup, BackupMetadataData as BackupMetadataDataInterface, BackupFilter } from "./types.js";

export class BackupMetadata {
  private readonly store = new Map<string, Backup>();

  add(backup: Backup): void {
    this.store.set(backup.id, backup);
  }

  get(backupId: string): Backup | null {
    return this.store.get(backupId) ?? null;
  }

  getMetadata(backupId: string): BackupMetadataDataInterface | null {
    const backup = this.store.get(backupId);
    if (!backup) {
      return null;
    }
    return this.toMetadataData(backup);
  }

  update(backup: Backup): void {
    this.store.set(backup.id, backup);
  }

  remove(backupId: string): boolean {
    return this.store.delete(backupId);
  }

  list(filter?: BackupFilter): Backup[] {
    let results = Array.from(this.store.values());

    if (filter) {
      if (filter.name) {
        results = results.filter((b) => b.name === filter.name);
      }
      if (filter.type) {
        results = results.filter((b) => b.type === filter.type);
      }
      if (filter.state) {
        results = results.filter((b) => b.state === filter.state);
      }
      if (filter.tags && filter.tags.length > 0) {
        results = results.filter((b) => filter.tags!.some((t) => b.tags.includes(t)));
      }
      if (filter.createdAfter) {
        results = results.filter((b) => b.triggeredAt >= filter.createdAfter!);
      }
      if (filter.createdBefore) {
        results = results.filter((b) => b.triggeredAt <= filter.createdBefore!);
      }
      if (filter.parentBackupId) {
        results = results.filter((b) => b.parentBackupId === filter.parentBackupId);
      }
    }

    return results.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  count(filter?: BackupFilter): number {
    return this.list(filter).length;
  }

  clear(): void {
    this.store.clear();
  }

  private toMetadataData(backup: Backup): BackupMetadataDataInterface {
    return {
      id: backup.id,
      backupId: backup.id,
      name: backup.name,
      type: backup.type,
      state: backup.state,
      sizeBytes: backup.sizeBytes,
      checksum: backup.checksum,
      storagePath: backup.storagePath,
      storageBucket: backup.storageBucket,
      version: backup.version,
      triggeredAt: backup.triggeredAt,
      completedAt: backup.completedAt,
      verifiedAt: backup.verifiedAt,
      expiresAt: backup.expiresAt,
      error: backup.error,
      parentBackupId: backup.parentBackupId,
      tags: backup.tags,
      metadata: backup.metadata,
    };
  }
}
