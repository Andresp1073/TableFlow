import type { EventPublisher, Event } from "../event-bus/types.js";
import type { Logger } from "../observability/types.js";
import type { Schedule, ScheduleEventType } from "./types.js";
import { generateEventId, generateCorrelationId } from "../event-bus/EventMetadata.js";

export function createScheduleEvent(
  type: ScheduleEventType,
  schedule: Schedule,
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
      source: "ScheduleManager",
      custom: {
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        triggerType: schedule.trigger.type,
        state: schedule.state,
      },
    },
    payload: {
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      triggerType: schedule.trigger.type,
      state: schedule.state,
      jobName: schedule.jobName,
      description: schedule.description,
      tags: schedule.tags,
      ...additionalPayload,
    },
  };
}

export async function publishScheduleEvent(
  publisher: EventPublisher | undefined,
  logger: Logger | undefined,
  type: ScheduleEventType,
  schedule: Schedule,
  additionalPayload?: Record<string, unknown>,
): Promise<void> {
  if (!publisher) {
    return;
  }

  try {
    const event = createScheduleEvent(type, schedule, additionalPayload);
    await publisher.publish(event);
  } catch (error) {
    logger?.error("Failed to publish schedule event", {
      eventType: type,
      scheduleName: schedule.name,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
