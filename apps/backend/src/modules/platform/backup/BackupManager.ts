import type {
  Backup,
  BackupDataEntry,
  BackupPolicyConfig,
  BackupResult as BackupResultInterface,
  BackupType,
  BackupState,
  StorageProvider,
  Logger,
  EventPublisher,
} from "./types.js";
import type { BackupMetadata } from "./BackupMetadata.js";
import type { BackupPolicy } from "./BackupPolicy.js";
import { buildBackupResult, generateBackupResultId } from "./BackupResult.js";
import { publishBackupEvent } from "./events.js";
import { BackupNotFoundError, BackupStateTransitionError } from "./errors.js";

let backupIdCounter = 0;

function generateBackupId(): string {
  const timestamp = Date.now().toString(36);
  const counter = (backupIdCounter++).toString(36).padStart(4, "0");
  const random = Math.random().toString(36).slice(2, 6);
  return `bkp_${timestamp}${counter}${random}`;
}

function computeChecksum(content: string): string {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash + content.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

export class BackupManager {
  private logger?: Logger;
  private eventPublisher?: EventPublisher;

  constructor(
    private readonly metadata: BackupMetadata,
    private readonly policy: BackupPolicy,
    private readonly storageProvider?: StorageProvider,
  ) {}

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  setEventPublisher(publisher: EventPublisher): void {
    this.eventPublisher = publisher;
  }

  async createBackup(
    name: string,
    type: BackupType,
    entries: BackupDataEntry[],
    policyConfig: BackupPolicyConfig,
    options?: { tags?: string[]; metadata?: Record<string, unknown>; parentBackupId?: string },
  ): Promise<BackupResultInterface> {
    const validation = this.policy.validate(policyConfig);
    if (!validation.valid) {
      return buildBackupResult(
        { id: "", name, type, state: "failed", policy: policyConfig, data: [], triggeredAt: new Date(), expiresAt: new Date(), tags: [], metadata: {} } as Backup,
        "failed",
        { error: `Invalid policy: ${validation.errors.join("; ")}` },
      );
    }

    if (!this.policy.supportsBackupType(type)) {
      return buildBackupResult(
        { id: "", name, type, state: "failed", policy: policyConfig, data: [], triggeredAt: new Date(), expiresAt: new Date(), tags: [], metadata: {} } as Backup,
        "failed",
        { error: `Backup type "${type}" not supported` },
      );
    }

    const totalSize = entries.reduce((sum, e) => sum + e.content.length, 0);
    const combinedContent = entries.map((e) => e.content).join("");
    const checksum = computeChecksum(combinedContent);
    const triggeredAt = new Date();

    const backup: Backup = {
      id: generateBackupId(),
      name,
      type,
      state: "running",
      policy: policyConfig,
      data: entries,
      triggeredAt,
      startedAt: triggeredAt,
      expiresAt: this.policy.getDefaultExpiry(policyConfig),
      sizeBytes: totalSize,
      checksum,
      tags: options?.tags ?? [],
      metadata: options?.metadata ?? {},
      parentBackupId: options?.parentBackupId,
    };

    this.metadata.add(backup);
    this.logger?.info(`Backup "${name}" started`, { backupId: backup.id, type, sizeBytes: totalSize });
    publishBackupEvent(this.eventPublisher, this.logger, "backup.started", backup);

    try {
      if (this.storageProvider) {
        const storagePath = `backups/${name}/${backup.id}.json`;
        const content = JSON.stringify({
          id: backup.id,
          name: backup.name,
          type: backup.type,
          checksum: backup.checksum,
          entries,
          triggeredAt: triggeredAt.toISOString(),
          tags: backup.tags,
          metadata: backup.metadata,
        });

        const uploadResult = await this.storageProvider.upload({
          path: storagePath,
          content,
          contentType: "application/json",
          bucket: policyConfig.storageBucket,
          metadata: {
            "backup-id": backup.id,
            "backup-name": backup.name,
            "backup-type": type,
            "checksum": checksum,
          },
        });

        backup.storagePath = uploadResult.path;
        backup.storageBucket = uploadResult.bucket;
        backup.version = uploadResult.version;
      }

      backup.state = "completed";
      backup.completedAt = new Date();
      this.metadata.update(backup);

      this.logger?.info(`Backup "${name}" completed`, { backupId: backup.id, durationMs: backup.completedAt.getTime() - triggeredAt.getTime() });
      publishBackupEvent(this.eventPublisher, this.logger, "backup.completed", backup);

      if (this.policy.shouldVerify(policyConfig)) {
        const verifyResult = await this.verifyBackup(backup.id);
        return verifyResult;
      }

      return buildBackupResult(backup, "completed", { startedAt: triggeredAt });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      backup.state = "failed";
      backup.error = errorMessage;
      backup.completedAt = new Date();
      this.metadata.update(backup);

      this.logger?.error(`Backup "${name}" failed`, { backupId: backup.id, error: errorMessage });
      publishBackupEvent(this.eventPublisher, this.logger, "backup.failed", backup, { error: errorMessage });

      return buildBackupResult(backup, "failed", { error: errorMessage, startedAt: triggeredAt });
    }
  }

  async verifyBackup(backupId: string): Promise<BackupResultInterface> {
    const backup = this.metadata.get(backupId);
    if (!backup) {
      throw new BackupNotFoundError(backupId);
    }

    if (backup.state !== "completed") {
      throw new BackupStateTransitionError(backupId, backup.state, "verified");
    }

    const startedAt = new Date();

    if (this.storageProvider && backup.storagePath) {
      try {
        const downloadResult = await this.storageProvider.download(
          backup.storagePath,
          backup.storageBucket,
        );

        const parsed = JSON.parse(downloadResult.content) as { checksum?: string; entries?: Array<{ content: string }> };
        const storedChecksum = parsed.checksum;

        if (storedChecksum && storedChecksum !== backup.checksum) {
          backup.state = "failed";
          backup.error = "Checksum mismatch during verification";
          this.metadata.update(backup);

          return buildBackupResult(backup, "failed", {
            error: "Checksum mismatch during verification",
            startedAt,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        backup.state = "failed";
        backup.error = `Verification failed: ${errorMessage}`;
        this.metadata.update(backup);

        return buildBackupResult(backup, "failed", {
          error: `Verification failed: ${errorMessage}`,
          startedAt,
        });
      }
    }

    backup.state = "verified";
    backup.verifiedAt = new Date();
    this.metadata.update(backup);

    publishBackupEvent(this.eventPublisher, this.logger, "backup.verified", backup);

    return buildBackupResult(backup, "verified", { startedAt, verified: true });
  }

  async expireBackups(): Promise<number> {
    const allBackups = this.metadata.list();
    const now = Date.now();
    let expiredCount = 0;

    for (const backup of allBackups) {
      if (backup.state === "expired") {
        continue;
      }

      const ageMs = now - backup.triggeredAt.getTime();
      if (this.policy.isExpired(backup.policy, ageMs)) {
        backup.state = "expired";
        this.metadata.update(backup);
        expiredCount++;

        publishBackupEvent(this.eventPublisher, this.logger, "backup.expired", backup);
        this.logger?.info(`Backup "${backup.name}" expired`, { backupId: backup.id });
      }
    }

    return expiredCount;
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    const backup = this.metadata.get(backupId);
    if (!backup) {
      return false;
    }

    if (this.storageProvider && backup.storagePath) {
      try {
        await this.storageProvider.delete(backup.storagePath, backup.storageBucket);
      } catch (error) {
        this.logger?.warn(`Failed to delete storage for backup "${backupId}"`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.metadata.remove(backupId);
    publishBackupEvent(this.eventPublisher, this.logger, "backup.deleted", backup);
    return true;
  }
}
