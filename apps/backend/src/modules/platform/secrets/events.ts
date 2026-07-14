import type { EventPublisher, Event } from "../event-bus/types.js";
import type { Logger } from "../observability/types.js";
import type { SecretEventType, SecretType } from "./types.js";
import { generateEventId, generateCorrelationId } from "../event-bus/EventMetadata.js";

export function createSecretEvent(
  type: SecretEventType,
  secretKey: string,
  secretType: SecretType,
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
      source: "SecretsManager",
      custom: { secretKey, secretType },
    },
    payload: {
      secretKey,
      secretType,
      ...additionalPayload,
    },
  };
}

export async function publishSecretEvent(
  publisher: EventPublisher | undefined,
  logger: Logger | undefined,
  type: SecretEventType,
  secretKey: string,
  secretType: SecretType,
  additionalPayload?: Record<string, unknown>,
): Promise<void> {
  if (!publisher) {
    return;
  }

  try {
    const event = createSecretEvent(type, secretKey, secretType, additionalPayload);
    await publisher.publish(event);
  } catch (error) {
    logger?.error("Failed to publish secret event", {
      eventType: type,
      secretKey,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
