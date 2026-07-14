import type { EventPublisher, Event } from "../event-bus/types.js";
import type { Logger } from "../observability/types.js";
import type { FeatureFlagEventType, FlagValue } from "./types.js";
import { generateEventId, generateCorrelationId } from "../event-bus/EventMetadata.js";

export function createFeatureFlagEvent(
  type: FeatureFlagEventType,
  flagKey: string,
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
      source: "FeatureFlagManager",
      custom: { flagKey },
    },
    payload: {
      flagKey,
      ...additionalPayload,
    },
  };
}

export async function publishFeatureFlagEvent(
  publisher: EventPublisher | undefined,
  logger: Logger | undefined,
  type: FeatureFlagEventType,
  flagKey: string,
  additionalPayload?: Record<string, unknown>,
): Promise<void> {
  if (!publisher) {
    return;
  }

  try {
    const event = createFeatureFlagEvent(type, flagKey, additionalPayload);
    await publisher.publish(event);
  } catch (error) {
    logger?.error("Failed to publish feature flag event", {
      eventType: type,
      flagKey,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
