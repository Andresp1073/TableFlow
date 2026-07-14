# Enterprise Backup & Restore Framework

## Architecture

The Backup & Restore Framework provides a provider-agnostic disaster recovery backbone for business modules. It follows Clean Architecture and Dependency Inversion — business modules depend only on the `BackupProvider` interface.

```
┌─────────────────────────────────────────────────────────────┐
│                  Business Module (consumer)                  │
│              depends on: BackupProvider                     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     BackupCoordinator                         │
│  ┌──────────────┬──────────────┬────────────┬────────────┐  │
│  │ BackupManager│ RestoreMgr   │ Backup     │ Backup     │  │
│  │ (create/     │ (execute     │ Policy     │ Metadata   │  │
│  │  verify/     │  restore)    │ (retention,│ (query/    │  │
│  │  expire)     │              │  verify)   │  filter)   │  │
│  └──────┬───────┴──────┬───────┴─────┬──────┴──────┬─────┘  │
│         │              │             │             │        │
│  ┌──────▼──────┐ ┌─────▼──────┐ ┌────▼─────┐ ┌────▼─────┐ │
│  │  Storage    │ │ Background │ │ Scheduler│ │ Events   │ │
│  │  Provider   │ │ Jobs       │ │          │ │          │ │
│  └─────────────┘ └────────────┘ └──────────┘ └──────────┘ │
└────────────────────────────────────────────────────────────┘
```

## Components

| Component | Responsibility |
|---|---|
| **BackupCoordinator** | Top-level orchestrator implementing `BackupProvider`. Delegates to BackupManager, RestoreManager. Provides scheduler integration for scheduled backups. |
| **BackupManager** | Backup creation, state management, verification, expiry, and deletion. Computes checksum, tracks size, stores to Storage Provider. |
| **RestoreManager** | Executes restore operations from stored backups. Supports full, selective, version, and point-in-time restore. |
| **BackupPolicy** | Validates policy config, checks retention limits, determines expiry, supports backup type validation. |
| **BackupMetadata** | In-memory metadata store with query/filter capabilities. Lists by name, type, state, tags, date range, parent backup. |

## Backup Types

| Type | Description | Behavior |
|---|---|---|
| **Full** | Complete snapshot of all data | Stores all entries; independent restore |
| **Incremental** | Only data changed since last backup | Stores partial entries; references parent backup |
| **Differential** | Only data changed since last full backup | Stores partial entries; references parent backup |
| **Snapshot** | Prepared for future implementation | Full read/write isolation prepared |

## Backup Lifecycle

```
  ┌──────────┐
  │  Pending │  (initial state on creation)
  └────┬─────┘
       │
  ┌────▼─────┐
  │  Running │  (storage upload in progress)
  └────┬─────┘
       │
  ┌────▼──────┐      ┌──────────┐
  │ Completed │──────►│ Verified │  (optional verification)
  └────┬──────┘      └──────────┘
       │
  ┌────▼──────┐
  │  Expired  │  (retention period elapsed)
  └───────────┘

  ┌──────────┐
  │  Failed  │  (any step fails)
  └──────────┘
```

## Backup States

| State | Description |
|---|---|
| `pending` | Backup initialized but not yet started |
| `running` | Backup in progress (storage upload) |
| `completed` | Backup stored successfully |
| `failed` | Backup failed during execution |
| `verified` | Backup verified (checksum validated) |
| `expired` | Retention period elapsed |

## Backup Policies

### Retention Period
Duration in milliseconds that a backup is kept before being eligible for expiry. Default: 30 days.

### Max Versions
Maximum number of backup versions to retain. When exceeded, the oldest backups are expired.

### Compression
Prepared for future implementation:
- `none`: No compression
- `gzip`: Gzip compression
- `zstd`: Zstandard compression

### Encryption
Prepared for future implementation:
- `none`: No encryption
- `aes256`: AES-256 encryption
- `aes512`: AES-512 encryption

### Verification
When `verifyAfterBackup: true`, the backup is automatically verified after creation by downloading and comparing checksums.

## Restore Workflow

```
  ┌─────────────┐
  │  Select     │  Choose backup by ID
  │  Backup     │
  └──────┬──────┘
         │
  ┌──────▼──────┐
  │  Choose     │  full | selective | version | point-in-time
  │  Restore    │
  │  Type       │
  └──────┬──────┘
         │
  ┌──────▼──────┐
  │  Configure  │  Optional: destination bucket/path, entry filter
  │  Options    │
  └──────┬──────┘
         │
  ┌──────▼──────┐
  │  Execute    │  Upload entries to destination via Storage Provider
  │  Restore    │
  └──────┬──────┘
         │
  ┌──────▼──────┐
  │  Result     │  completed | partial | failed
  └─────────────┘
```

## Restore Types

| Type | Description |
|---|---|
| **Full** | Restores all entries from the backup |
| **Selective** | Restores only specified entry keys |
| **Version** | Restores from a specific backup version |
| **Point-in-time** | Prepared for future implementation |

## Events

| Event | Description |
|---|---|
| `backup.started` | A backup creation has started |
| `backup.completed` | A backup was completed successfully |
| `backup.failed` | A backup failed during execution |
| `backup.verified` | A backup passed verification |
| `backup.expired` | A backup expired due to retention policy |
| `backup.deleted` | A backup was deleted |
| `restore.started` | A restore operation has started |
| `restore.completed` | A restore was completed successfully |
| `restore.failed` | A restore operation failed |

## Example Usage

```typescript
import { BackupCoordinator, BackupManager, RestoreManager, BackupMetadata, BackupPolicy } from "./backup/index.js";
import { FixedIntervalTrigger } from "../scheduler/index.js";

const metadata = new BackupMetadata();
const policy = new BackupPolicy();
const storageProvider = getStorageProvider();
const backupManager = new BackupManager(metadata, policy, storageProvider);
const restoreManager = new RestoreManager(metadata, storageProvider);
const coordinator = new BackupCoordinator(backupManager, restoreManager, metadata, policy);

coordinator.setStorageProvider(storageProvider);
coordinator.setLogger(logger);
coordinator.setEventPublisher(eventBus);

// Create a full backup
const result = await coordinator.createBackup(
  "nightly-full",
  "full",
  [
    { key: "users", content: JSON.stringify(userData), contentType: "application/json" },
    { key: "orders", content: JSON.stringify(orderData), contentType: "application/json" },
  ],
  {
    retentionPeriodMs: 30 * 24 * 60 * 60 * 1000,
    maxVersions: 10,
    compression: "none",
    encryption: "none",
    verifyAfterBackup: true,
    storageBucket: "backups",
    storagePolicy: "private",
  },
  { tags: ["production", "nightly"] },
);

// Restore from backup
const restoreResult = await coordinator.restoreBackup(
  result.backupId,
  "full",
  { destinationBucket: "restore-bucket" },
);

// List recent backups
const recent = await coordinator.listBackups({
  createdAfter: new Date(Date.now() - 86400000),
});

// Register a scheduled backup
coordinator.setScheduler(scheduler);
coordinator.registerScheduledBackup(
  "hourly-incremental",
  FixedIntervalTrigger.create(3600000, { id: "fi-hourly" }),
  "incremental",
  backupPolicy,
  { tags: ["automated", "hourly"] },
);
```

## Integration Points

| Dependency | Usage |
|---|---|
| **Storage Provider** | Upload backup data, download for verification/restore, delete expired backups |
| **Scheduler** | Register scheduled backup jobs via `registerScheduledBackup()` |
| **Background Jobs** | Execute backup jobs via the `backup-executor` job handler |
| **Configuration Center** | Retrieve backup policy configuration |
| **Observability** | Logging for all backup/restore operations |
| **Event Bus** | Publish lifecycle events for monitoring and alerting |

## Error Handling

| Error | Code | Description |
|---|---|---|
| `BackupNotFoundError` | BACKUP_NOT_FOUND | Requested backup ID does not exist |
| `BackupAlreadyExistsError` | BACKUP_ALREADY_EXISTS | Duplicate backup name |
| `BackupStateTransitionError` | BACKUP_INVALID_STATE_TRANSITION | Invalid state change |
| `BackupStorageError` | BACKUP_STORAGE_ERROR | Storage operation failed |
| `BackupPolicyViolationError` | BACKUP_POLICY_VIOLATION | Policy blocked operation |
| `RestoreFailedError` | RESTORE_FAILED | Restore execution failed |
| `BackupTypeNotSupportedError` | BACKUP_TYPE_NOT_SUPPORTED | Backup type not implemented |
| `RestoreTypeNotSupportedError` | RESTORE_TYPE_NOT_SUPPORTED | Restore type not implemented |

## Future Providers

- **Snapshot Provider**: Full read/write isolation for snapshot backups
- **Compression Engine**: Gzip/Zstd compression before storage
- **Encryption Engine**: AES-256/512 encryption before storage
- **Remote Storage**: S3, GCS, Azure Blob via Storage Provider
- **Distributed Locking**: Prevent concurrent backups in clustered environments
- **Database Backend**: Backup metadata persistence to database for crash recovery
