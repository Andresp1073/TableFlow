export type {
  BackupType,
  BackupState,
  RestoreType,
  BackupCompression,
  BackupEncryption,
  BackupPolicyConfig,
  BackupDataEntry,
  Backup,
  BackupMetadataData,
  BackupResult,
  RestoreOptions,
  RestoreResult,
  BackupFilter,
  BackupProvider as BackupProviderInterface,
  BackupEventType,
} from "./types.js";

export { BackupCoordinator } from "./BackupCoordinator.js";
export { BackupManager } from "./BackupManager.js";
export { RestoreManager } from "./RestoreManager.js";
export { BackupPolicy } from "./BackupPolicy.js";
export { BackupMetadata } from "./BackupMetadata.js";
export { buildBackupResult, generateBackupResultId } from "./BackupResult.js";
export { buildRestoreResult, generateRestoreResultId } from "./RestoreResult.js";
export { createBackupEvent, publishBackupEvent } from "./events.js";
export {
  BackupError,
  BackupNotFoundError,
  BackupAlreadyExistsError,
  BackupStateTransitionError,
  BackupStorageError,
  BackupPolicyViolationError,
  RestoreError,
  RestoreFailedError,
  BackupTypeNotSupportedError,
  RestoreTypeNotSupportedError,
} from "./errors.js";

export { DEFAULT_BACKUP_POLICY } from "./types.js";
