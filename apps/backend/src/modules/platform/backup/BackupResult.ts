import type { Backup, BackupResult as BackupResultInterface, BackupState } from "./types.js";

let backupResultCounter = 0;

export function generateBackupResultId(): string {
  const timestamp = Date.now().toString(36);
  const counter = (backupResultCounter++).toString(36).padStart(4, "0");
  return `br_${timestamp}${counter}`;
}

export function buildBackupResult(
  backup: Backup,
  status: BackupResultInterface["status"],
  options?: {
    error?: string;
    durationMs?: number;
    startedAt?: Date;
    verified?: boolean;
  },
): BackupResultInterface {
  const triggeredAt = options?.startedAt ?? backup.triggeredAt;
  const completedAt = new Date();
  const durationMs = options?.durationMs ?? completedAt.getTime() - triggeredAt.getTime();

  return {
    backupId: backup.id,
    name: backup.name,
    type: backup.type,
    state: backup.state,
    status,
    storagePath: backup.storagePath,
    storageBucket: backup.storageBucket,
    checksum: backup.checksum,
    sizeBytes: backup.sizeBytes,
    durationMs,
    error: options?.error,
    verified: options?.verified,
    startedAt: triggeredAt,
    completedAt,
  };
}
