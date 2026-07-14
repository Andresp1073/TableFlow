import type {
  Backup,
  BackupDataEntry,
  RestoreOptions,
  RestoreResult as RestoreResultInterface,
  RestoreType,
  StorageProvider,
  Logger,
  EventPublisher,
} from "./types.js";
import type { BackupMetadata } from "./BackupMetadata.js";
import { buildRestoreResult, generateRestoreResultId } from "./RestoreResult.js";
import { publishBackupEvent } from "./events.js";
import {
  BackupNotFoundError,
  RestoreFailedError,
  RestoreTypeNotSupportedError,
} from "./errors.js";

export class RestoreManager {
  private logger?: Logger;
  private eventPublisher?: EventPublisher;

  constructor(
    private readonly metadata: BackupMetadata,
    private readonly storageProvider?: StorageProvider,
  ) {}

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  setEventPublisher(publisher: EventPublisher): void {
    this.eventPublisher = publisher;
  }

  async restore(
    backupId: string,
    type: RestoreType,
    options?: RestoreOptions,
  ): Promise<RestoreResultInterface> {
    const backup = this.metadata.get(backupId);
    if (!backup) {
      throw new BackupNotFoundError(backupId);
    }

    const startedAt = new Date();
    const restoreId = generateRestoreResultId();

    this.logger?.info(`Restore "${backup.name}" started`, {
      backupId,
      restoreId,
      type,
      restoreType: type,
    });

    publishBackupEvent(this.eventPublisher, this.logger, "restore.started", backup, {
      restoreId,
      restoreType: type,
    });

    try {
      const result = await this.executeRestore(backup, type, options, startedAt);
      this.logger?.info(`Restore "${backup.name}" completed`, {
        backupId,
        restoreId,
        entriesRestored: result.entriesRestored,
      });
      publishBackupEvent(this.eventPublisher, this.logger, "restore.completed", backup, {
        restoreId,
        entriesRestored: result.entriesRestored,
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error(`Restore "${backup.name}" failed`, {
        backupId,
        restoreId,
        error: errorMessage,
      });
      publishBackupEvent(this.eventPublisher, this.logger, "restore.failed", backup, {
        restoreId,
        error: errorMessage,
      });

      return buildRestoreResult(backupId, backup.name, type, "failed", {
        error: errorMessage,
        startedAt,
      });
    }
  }

  private async executeRestore(
    backup: Backup,
    type: RestoreType,
    options: RestoreOptions | undefined,
    startedAt: Date,
  ): Promise<RestoreResultInterface> {
    let entriesToRestore: BackupDataEntry[];

    switch (type) {
      case "full":
        entriesToRestore = this.getFullRestoreEntries(backup);
        break;
      case "selective":
        entriesToRestore = this.getSelectiveRestoreEntries(backup, options);
        break;
      case "version":
        entriesToRestore = this.getVersionRestoreEntries(backup, options);
        break;
      case "point-in-time":
        entriesToRestore = this.getPointInTimeRestoreEntries(backup, options);
        break;
      default:
        throw new RestoreTypeNotSupportedError(backup.id, type);
    }

    if (entriesToRestore.length === 0) {
      return buildRestoreResult(backup.id, backup.name, type, "completed", {
        entriesRestored: 0,
        startedAt,
        destinationBucket: options?.destinationBucket,
        destinationPath: options?.destinationPath,
      });
    }

    let restored = 0;
    let failed = 0;
    const failedEntries: string[] = [];

    if (this.storageProvider) {
      for (const entry of entriesToRestore) {
        try {
          const destPath = options?.destinationPath
            ? `${options.destinationPath}/${entry.key}`
            : `restore/${backup.name}/${entry.key}`;

          await this.storageProvider.upload({
            path: destPath,
            content: entry.content,
            contentType: entry.contentType ?? "application/octet-stream",
            bucket: options?.destinationBucket ?? backup.policy.storageBucket,
            metadata: entry.metadata,
          });
          restored++;
        } catch (error) {
          failed++;
          failedEntries.push(entry.key);
          this.logger?.warn(`Failed to restore entry "${entry.key}"`, {
            backupId: backup.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } else {
      restored = entriesToRestore.length;
    }

    const status = failed === 0 ? "completed" : restored > 0 ? "partial" : "failed";

    return buildRestoreResult(backup.id, backup.name, type, status, {
      entriesRestored: restored,
      entriesFailed: failed,
      failedEntries,
      startedAt,
      destinationBucket: options?.destinationBucket,
      destinationPath: options?.destinationPath,
    });
  }

  private getFullRestoreEntries(backup: Backup): BackupDataEntry[] {
    return backup.data;
  }

  private getSelectiveRestoreEntries(
    backup: Backup,
    options: RestoreOptions | undefined,
  ): BackupDataEntry[] {
    if (!options?.entries || options.entries.length === 0) {
      return backup.data;
    }
    return backup.data.filter((e) => options.entries!.includes(e.key));
  }

  private getVersionRestoreEntries(
    backup: Backup,
    _options: RestoreOptions | undefined,
  ): BackupDataEntry[] {
    return backup.data;
  }

  private getPointInTimeRestoreEntries(
    backup: Backup,
    _options: RestoreOptions | undefined,
  ): BackupDataEntry[] {
    return backup.data;
  }
}
