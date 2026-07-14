import type { Schedule, ScheduleContext as ScheduleContextInterface, TriggerType } from "./types.js";

let executionCounter = 0;

function generateExecutionId(): string {
  const timestamp = Date.now().toString(36);
  const counter = (executionCounter++).toString(36).padStart(4, "0");
  const random = Math.random().toString(36).slice(2, 8);
  return `exec_${timestamp}${counter}${random}`;
}

export function createScheduleContext(
  schedule: Schedule,
  attempt: number = 1,
): ScheduleContextInterface {
  return {
    scheduleId: schedule.id,
    scheduleName: schedule.name,
    executionId: generateExecutionId(),
    triggeredAt: new Date(),
    triggerType: schedule.trigger.type as TriggerType,
    metadata: {
      ...schedule.metadata,
      attempt,
      scheduleDescription: schedule.description,
      jobName: schedule.jobName,
    },
    attempt,
  };
}

export { generateExecutionId };
