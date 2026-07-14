import type { EventPublisher, Event } from "../event-bus/types.js";
import type { Logger } from "../observability/types.js";
import type { StorageEventType } from "./types.js";
import { generateEventId, generateCorrelationId } from "../event-bus/EventMetadata.js";

export function createStorageEvent(
  type: StorageEventType,
  path: string,
  bucket: string,
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
      source: "StorageManager",
      custom: { path, bucket },
    },
    payload: {
      path,
      bucket,
      ...additionalPayload,
    },
  };
}

export async function publishStorageEvent(
  publisher: EventPublisher | undefined,
  logger: Logger | undefined,
  type: StorageEventType,
  path: string,
  bucket: string,
  additionalPayload?: Record<string, unknown>,
): Promise<void> {
  if (!publisher) {
    return;
  }

  try {
    const event = createStorageEvent(type, path, bucket, additionalPayload);
    await publisher.publish(event);
  } catch (error) {
    logger?.error("Failed to publish storage event", {
      eventType: type,
      path,
      bucket,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
