import type { BackupType, RestoreType } from "./types.js";

export class BackupError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly backupId?: string,
  ) {
    super(message);
    this.name = "BackupError";
  }
}

export class BackupNotFoundError extends BackupError {
  constructor(backupId: string) {
    super(
      `Backup "${backupId}" not found`,
      "BACKUP_NOT_FOUND",
      backupId,
    );
    this.name = "BackupNotFoundError";
  }
}

export class BackupAlreadyExistsError extends BackupError {
  constructor(name: string) {
    super(
      `Backup "${name}" already exists`,
      "BACKUP_ALREADY_EXISTS",
    );
    this.name = "BackupAlreadyExistsError";
  }
}

export class BackupStateTransitionError extends BackupError {
  constructor(backupId: string, from: string, to: string) {
    super(
      `Cannot transition backup "${backupId}" from "${from}" to "${to}"`,
      "BACKUP_INVALID_STATE_TRANSITION",
      backupId,
    );
    this.name = "BackupStateTransitionError";
  }
}

export class BackupStorageError extends BackupError {
  constructor(backupId: string, operation: string, reason: string) {
    super(
      `Storage ${operation} failed for backup "${backupId}": ${reason}`,
      "BACKUP_STORAGE_ERROR",
      backupId,
    );
    this.name = "BackupStorageError";
  }
}

export class BackupPolicyViolationError extends BackupError {
  constructor(backupId: string, policy: string, reason: string) {
    super(
      `Policy "${policy}" violation for backup "${backupId}": ${reason}`,
      "BACKUP_POLICY_VIOLATION",
      backupId,
    );
    this.name = "BackupPolicyViolationError";
  }
}

export class RestoreError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly backupId?: string,
    public readonly restoreId?: string,
  ) {
    super(message);
    this.name = "RestoreError";
  }
}

export class RestoreFailedError extends RestoreError {
  constructor(backupId: string, restoreId: string, reason: string) {
    super(
      `Restore "${restoreId}" failed for backup "${backupId}": ${reason}`,
      "RESTORE_FAILED",
      backupId,
      restoreId,
    );
    this.name = "RestoreFailedError";
  }
}

export class BackupTypeNotSupportedError extends BackupError {
  constructor(backupId: string, type: BackupType) {
    super(
      `Backup type "${type}" not supported for backup "${backupId}"`,
      "BACKUP_TYPE_NOT_SUPPORTED",
      backupId,
    );
    this.name = "BackupTypeNotSupportedError";
  }
}

export class RestoreTypeNotSupportedError extends RestoreError {
  constructor(backupId: string, type: RestoreType) {
    super(
      `Restore type "${type}" not supported for backup "${backupId}"`,
      "RESTORE_TYPE_NOT_SUPPORTED",
      backupId,
    );
    this.name = "RestoreTypeNotSupportedError";
  }
}
