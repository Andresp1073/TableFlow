import type {
  BackupProvider as BackupProviderInterface,
  BackupType,
  BackupDataEntry,
  BackupPolicyConfig,
  BackupResult as BackupResultInterface,
  BackupFilter,
  Backup,
  BackupMetadataData,
  RestoreType,
  RestoreOptions,
  RestoreResult as RestoreResultInterface,
  StorageProvider,
  Logger,
  EventPublisher,
} from "./types.js";
import type { Scheduler, ScheduleTriggerConfig, SchedulePolicyConfig } from "../scheduler/types.js";
import type { BackupManager } from "./BackupManager.js";
import type { RestoreManager } from "./RestoreManager.js";
import type { BackupMetadata } from "./BackupMetadata.js";
import type { BackupPolicy } from "./BackupPolicy.js";
import { BackupNotFoundError } from "./errors.js";

export class BackupCoordinator implements BackupProviderInterface {
  private logger?: Logger;
  private eventPublisher?: EventPublisher;
  private scheduler?: Scheduler;

  constructor(
    private readonly backupManager: BackupManager,
    private readonly restoreManager: RestoreManager,
    private readonly metadata: BackupMetadata,
    private readonly policy: BackupPolicy,
  ) {}

  setLogger(logger: Logger): void {
    this.logger = logger;
    this.backupManager.setLogger(logger);
    this.restoreManager.setLogger(logger);
  }

  setEventPublisher(publisher: EventPublisher): void {
    this.eventPublisher = publisher;
    this.backupManager.setEventPublisher(publisher);
    this.restoreManager.setEventPublisher(publisher);
  }

  setStorageProvider(provider: StorageProvider): void {
    const manager = this.backupManager as { storageProvider?: StorageProvider };
    manager.storageProvider = provider;
    const restorer = this.restoreManager as { storageProvider?: StorageProvider };
    restorer.storageProvider = provider;
  }

  setScheduler(scheduler: Scheduler): void {
    this.scheduler = scheduler;
  }

  async createBackup(
    name: string,
    type: BackupType,
    entries: BackupDataEntry[],
    policyConfig: BackupPolicyConfig,
    options?: { tags?: string[]; metadata?: Record<string, unknown>; parentBackupId?: string },
  ): Promise<BackupResultInterface> {
    return this.backupManager.createBackup(name, type, entries, policyConfig, options);
  }

  async restoreBackup(
    backupId: string,
    type: RestoreType,
    options?: RestoreOptions,
  ): Promise<RestoreResultInterface> {
    return this.restoreManager.restore(backupId, type, options);
  }

  async listBackups(filter?: BackupFilter): Promise<Backup[]> {
    return this.metadata.list(filter);
  }

  async getBackup(backupId: string): Promise<Backup | null> {
    return this.metadata.get(backupId);
  }

  async getBackupMetadata(backupId: string): Promise<BackupMetadataData | null> {
    return this.metadata.getMetadata(backupId);
  }

  async verifyBackup(backupId: string): Promise<BackupResultInterface> {
    return this.backupManager.verifyBackup(backupId);
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    return this.backupManager.deleteBackup(backupId);
  }

  async expireBackups(): Promise<number> {
    return this.backupManager.expireBackups();
  }

  registerScheduledBackup(
    name: string,
    trigger: ScheduleTriggerConfig,
    backupType: BackupType,
    policyConfig: BackupPolicyConfig,
    options?: { tags?: string[]; metadata?: Record<string, unknown> },
  ): void {
    if (!this.scheduler) {
      this.logger?.warn(`Cannot register scheduled backup "${name}": no scheduler configured`);
      return;
    }

    const schedulePolicy: SchedulePolicyConfig = {
      executionTimeoutMs: trigger.type === "fixed-interval"
        ? trigger.intervalMs * 2
        : 3600000,
      retryPolicy: { maxRetries: 2, delayMs: 30000, backoffMultiplier: 2 },
      overlapPolicy: "skip",
      misfirePolicy: "skip",
    };

    if (backupType === "full" || backupType === "incremental" || backupType === "differential") {
      this.scheduler.registerSchedule({
        id: `backup-${name}`,
        name: `Backup:${name}`,
        trigger,
        jobName: "backup-executor",
        jobData: {
          backupName: name,
          backupType,
          policyConfig,
          tags: options?.tags,
          metadata: options?.metadata,
        },
        state: "enabled",
        policy: schedulePolicy,
        tags: ["backup", ...(options?.tags ?? [])],
        metadata: { backupName: name, backupType, ...(options?.metadata ?? {}) },
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0,
        misfireCount: 0,
      });
    }

    this.logger?.info(`Scheduled backup "${name}" registered`, { backupType });
  }
}
