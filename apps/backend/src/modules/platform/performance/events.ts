import type { EventPublisher, Event } from "../event-bus/types.js";
import type { Logger } from "../observability/types.js";
import type { PerformanceEventType } from "./types.js";
import { generateEventId, generateCorrelationId } from "../event-bus/EventMetadata.js";

export function createPerformanceEvent(
  type: PerformanceEventType,
  resourceName: string,
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
      source: "PerformanceManager",
      custom: { resourceName },
    },
    payload: {
      resourceName,
      ...additionalPayload,
    },
  };
}

export async function publishPerformanceEvent(
  publisher: EventPublisher | undefined,
  logger: Logger | undefined,
  type: PerformanceEventType,
  resourceName: string,
  additionalPayload?: Record<string, unknown>,
): Promise<void> {
  if (!publisher) {
    return;
  }

  try {
    const event = createPerformanceEvent(type, resourceName, additionalPayload);
    await publisher.publish(event);
  } catch (error) {
    logger?.error("Failed to publish performance event", {
      eventType: type,
      resourceName,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
