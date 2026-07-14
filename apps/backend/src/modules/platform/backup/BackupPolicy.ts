import type { BackupPolicyConfig, BackupType } from "./types.js";

export interface BackupPolicyValidationResult {
  valid: boolean;
  errors: string[];
}

export interface BackupPolicyCheckResult {
  allowed: boolean;
  reason: string;
  expiredCount?: number;
}

export class BackupPolicy {
  validate(config: BackupPolicyConfig): BackupPolicyValidationResult {
    const errors: string[] = [];

    if (config.retentionPeriodMs <= 0) {
      errors.push("Retention period must be greater than 0");
    }
    if (config.maxVersions <= 0) {
      errors.push("Max versions must be greater than 0");
    }
    if (!config.storageBucket) {
      errors.push("Storage bucket is required");
    }
    if (!config.storagePolicy) {
      errors.push("Storage policy is required");
    }

    return { valid: errors.length === 0, errors };
  }

  checkRetention(
    config: BackupPolicyConfig,
    existingBackupCount: number,
    lastBackupAgeMs: number,
  ): BackupPolicyCheckResult {
    if (existingBackupCount >= config.maxVersions) {
      return {
        allowed: false,
        reason: `Max versions (${config.maxVersions}) reached: ${existingBackupCount} backups exist`,
        expiredCount: existingBackupCount - config.maxVersions + 1,
      };
    }

    return { allowed: true, reason: "Retention policy allows new backup" };
  }

  isExpired(config: BackupPolicyConfig, ageMs: number): boolean {
    return ageMs >= config.retentionPeriodMs;
  }

  shouldVerify(config: BackupPolicyConfig): boolean {
    return config.verifyAfterBackup;
  }

  getDefaultExpiry(config: BackupPolicyConfig): Date {
    return new Date(Date.now() + config.retentionPeriodMs);
  }

  supportsBackupType(type: BackupType): boolean {
    return type === "full" || type === "incremental" || type === "differential" || type === "snapshot";
  }
}
