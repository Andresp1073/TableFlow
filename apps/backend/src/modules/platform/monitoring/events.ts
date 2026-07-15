import type { EventPublisher, Event } from "../event-bus/types.js";
import type { Logger } from "../observability/types.js";
import type { MonitoringEventType } from "./types.js";
import { generateEventId, generateCorrelationId } from "../event-bus/EventMetadata.js";

export function createMonitoringEvent(
  type: MonitoringEventType,
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
      source: "MonitoringManager",
      custom: { resourceName },
    },
    payload: {
      resourceName,
      ...additionalPayload,
    },
  };
}

export async function publishMonitoringEvent(
  publisher: EventPublisher | undefined,
  logger: Logger | undefined,
  type: MonitoringEventType,
  resourceName: string,
  additionalPayload?: Record<string, unknown>,
): Promise<void> {
  if (!publisher) {
    return;
  }

  try {
    const event = createMonitoringEvent(type, resourceName, additionalPayload);
    await publisher.publish(event);
  } catch (error) {
    logger?.error("Failed to publish monitoring event", {
      eventType: type,
      resourceName,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
