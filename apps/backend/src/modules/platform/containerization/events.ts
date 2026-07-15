import type { EventPublisher, Event } from "../event-bus/types.js";
import type { Logger } from "../observability/types.js";
import type { ContainerEventType } from "./types.js";
import { generateEventId, generateCorrelationId } from "../event-bus/EventMetadata.js";

export function createContainerEvent(
  type: ContainerEventType,
  containerName: string,
  imageName: string,
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
      source: "Containerization",
      custom: { containerName, imageName },
    },
    payload: {
      containerName,
      imageName,
      ...additionalPayload,
    },
  };
}

export async function publishContainerEvent(
  publisher: EventPublisher | undefined,
  logger: Logger | undefined,
  type: ContainerEventType,
  containerName: string,
  imageName: string,
  additionalPayload?: Record<string, unknown>,
): Promise<void> {
  if (!publisher) {
    return;
  }

  try {
    const event = createContainerEvent(type, containerName, imageName, additionalPayload);
    await publisher.publish(event);
  } catch (error) {
    logger?.error("Failed to publish container event", {
      eventType: type,
      containerName,
      imageName,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
