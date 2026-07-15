import type { EventPublisher, Event } from "../event-bus/types.js";
import type { Logger } from "../observability/types.js";
import type { CiCdEventType, PipelineStageType } from "./types.js";
import { generateEventId, generateCorrelationId } from "../event-bus/EventMetadata.js";

export function createCiCdEvent(
  type: CiCdEventType,
  pipelineName: string,
  runId: string,
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
      source: "CiCdManager",
      custom: { pipelineName, runId },
    },
    payload: {
      pipelineName,
      runId,
      ...additionalPayload,
    },
  };
}

export function createPipelineEvent(
  type: CiCdEventType,
  pipelineName: string,
  runId: string,
  pipelineStatus: string,
  additionalPayload?: Record<string, unknown>,
): Event {
  return createCiCdEvent(type, pipelineName, runId, {
    status: pipelineStatus,
    ...additionalPayload,
  });
}

export function createStageEvent(
  type: CiCdEventType,
  pipelineName: string,
  runId: string,
  stageType: PipelineStageType,
  stageStatus: string,
  additionalPayload?: Record<string, unknown>,
): Event {
  return createCiCdEvent(type, pipelineName, runId, {
    stageType,
    stageStatus,
    ...additionalPayload,
  });
}

export async function publishCiCdEvent(
  publisher: EventPublisher | undefined,
  logger: Logger | undefined,
  type: CiCdEventType,
  pipelineName: string,
  runId: string,
  additionalPayload?: Record<string, unknown>,
): Promise<void> {
  if (!publisher) {
    return;
  }

  try {
    const event = createCiCdEvent(type, pipelineName, runId, additionalPayload);
    await publisher.publish(event);
  } catch (error) {
    logger?.error("Failed to publish CI/CD event", {
      eventType: type,
      pipelineName,
      runId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
