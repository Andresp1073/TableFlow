import type { EventPublisher, Event } from "../event-bus/types.js";
import type { Logger } from "../observability/types.js";
import type { BackupEventType, Backup } from "./types.js";
import { generateEventId, generateCorrelationId } from "../event-bus/EventMetadata.js";

export function createBackupEvent(
  type: BackupEventType,
  backup: Backup,
  additionalPayload?: Record<string, unknown>,
): Event {
  return {
    id: generateEventId(),
    type,
    occurredAt: new Date(),
    metadata: {
      correlationId: generateCorrelationId(),
      version: 1,
      timestamp: new Date().toISOString(),
      source: "BackupCoordinator",
      custom: {
        backupId: backup.id,
        backupName: backup.name,
        backupType: backup.type,
        state: backup.state,
      },
    },
    payload: {
      backupId: backup.id,
      backupName: backup.name,
      backupType: backup.type,
      state: backup.state,
      sizeBytes: backup.sizeBytes,
      checksum: backup.checksum,
      storagePath: backup.storagePath,
      tags: backup.tags,
      ...additionalPayload,
    },
  };
}

export async function publishBackupEvent(
  publisher: EventPublisher | undefined,
  logger: Logger | undefined,
  type: BackupEventType,
  backup: Backup,
  additionalPayload?: Record<string, unknown>,
): Promise<void> {
  if (!publisher) {
    return;
  }

  try {
    const event = createBackupEvent(type, backup, additionalPayload);
    await publisher.publish(event);
  } catch (error) {
    logger?.error("Failed to publish backup event", {
      eventType: type,
      backupId: backup.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
