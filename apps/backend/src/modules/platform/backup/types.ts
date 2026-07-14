import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";
import type { StorageProvider } from "../storage/types.js";
import type { Scheduler } from "../scheduler/types.js";

export type BackupType = "full" | "incremental" | "differential" | "snapshot";

export type BackupState = "pending" | "running" | "completed" | "failed" | "verified" | "expired";

export type RestoreType = "point-in-time" | "version" | "selective" | "full";

export type BackupCompression = "none" | "gzip" | "zstd";

export type BackupEncryption = "none" | "aes256" | "aes512";

export interface BackupPolicyConfig {
  readonly retentionPeriodMs: number;
  readonly maxVersions: number;
  readonly compression: BackupCompression;
  readonly encryption: BackupEncryption;
  readonly verifyAfterBackup: boolean;
  readonly scheduleName?: string;
  readonly storageBucket: string;
  readonly storagePolicy: string;
}

export interface BackupDataEntry {
  readonly key: string;
  readonly content: string;
  readonly contentType?: string;
  readonly metadata?: Record<string, string>;
}

export interface Backup {
  id: string;
  name: string;
  type: BackupType;
  state: BackupState;
  policy: BackupPolicyConfig;
  data: BackupDataEntry[];
  triggeredAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  verifiedAt?: Date;
  expiresAt: Date;
  sizeBytes?: number;
  checksum?: string;
  version?: string;
  storagePath?: string;
  storageBucket?: string;
  error?: string;
  parentBackupId?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface BackupMetadataData {
  readonly id: string;
  readonly backupId: string;
  readonly name: string;
  readonly type: BackupType;
  readonly state: BackupState;
  readonly sizeBytes?: number;
  readonly checksum?: string;
  readonly storagePath?: string;
  readonly storageBucket?: string;
  readonly version?: string;
  readonly triggeredAt: Date;
  readonly completedAt?: Date;
  readonly verifiedAt?: Date;
  readonly expiresAt: Date;
  readonly error?: string;
  readonly parentBackupId?: string;
  readonly tags: string[];
  readonly metadata: Record<string, unknown>;
}

export interface BackupResult {
  readonly backupId: string;
  readonly name: string;
  readonly type: BackupType;
  readonly state: BackupState;
  readonly status: "completed" | "failed" | "verified";
  readonly storagePath?: string;
  readonly storageBucket?: string;
  readonly checksum?: string;
  readonly sizeBytes?: number;
  readonly durationMs: number;
  readonly error?: string;
  readonly verified?: boolean;
  readonly startedAt: Date;
  readonly completedAt: Date;
}

export interface RestoreOptions {
  readonly targetBackupId?: string;
  readonly pointInTime?: Date;
  readonly entries?: string[];
  readonly destinationBucket?: string;
  readonly destinationPath?: string;
}

export interface RestoreResult {
  readonly restoreId: string;
  readonly backupId: string;
  readonly name: string;
  readonly type: RestoreType;
  readonly status: "completed" | "failed" | "partial";
  readonly entriesRestored: number;
  readonly entriesFailed: number;
  readonly failedEntries: string[];
  readonly durationMs: number;
  readonly error?: string;
  readonly startedAt: Date;
  readonly completedAt: Date;
  readonly destinationBucket?: string;
  readonly destinationPath?: string;
}

export interface BackupFilter {
  name?: string;
  type?: BackupType;
  state?: BackupState;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  parentBackupId?: string;
}

export interface BackupProvider {
  createBackup(
    name: string,
    type: BackupType,
    entries: BackupDataEntry[],
    policy: BackupPolicyConfig,
    options?: { tags?: string[]; metadata?: Record<string, unknown>; parentBackupId?: string },
  ): Promise<BackupResult>;
  restoreBackup(backupId: string, type: RestoreType, options?: RestoreOptions): Promise<RestoreResult>;
  listBackups(filter?: BackupFilter): Promise<Backup[]>;
  getBackup(backupId: string): Promise<Backup | null>;
  getBackupMetadata(backupId: string): Promise<BackupMetadataData | null>;
  verifyBackup(backupId: string): Promise<BackupResult>;
  deleteBackup(backupId: string): Promise<boolean>;
  expireBackups(): Promise<number>;
}

export type BackupEventType =
  | "backup.started"
  | "backup.completed"
  | "backup.failed"
  | "backup.verified"
  | "backup.expired"
  | "restore.started"
  | "restore.completed"
  | "restore.failed"
  | "backup.deleted";

export const DEFAULT_BACKUP_POLICY: BackupPolicyConfig = {
  retentionPeriodMs: 30 * 24 * 60 * 60 * 1000,
  maxVersions: 10,
  compression: "none",
  encryption: "none",
  verifyAfterBackup: true,
  storageBucket: "backups",
  storagePolicy: "private",
};
