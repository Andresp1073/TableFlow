import type { EventPublisher, Event } from "../event-bus/types.js";
import type { Logger } from "../observability/types.js";
import type { OrchestrationEventType } from "./types.js";
import { generateEventId, generateCorrelationId } from "../event-bus/EventMetadata.js";

export function createOrchestrationEvent(
  type: OrchestrationEventType,
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
      source: "OrchestrationManager",
      custom: { resourceName },
    },
    payload: {
      resourceName,
      ...additionalPayload,
    },
  };
}

export async function publishOrchestrationEvent(
  publisher: EventPublisher | undefined,
  logger: Logger | undefined,
  type: OrchestrationEventType,
  resourceName: string,
  additionalPayload?: Record<string, unknown>,
): Promise<void> {
  if (!publisher) {
    return;
  }

  try {
    const event = createOrchestrationEvent(type, resourceName, additionalPayload);
    await publisher.publish(event);
  } catch (error) {
    logger?.error("Failed to publish orchestration event", {
      eventType: type,
      resourceName,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
