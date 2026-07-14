import type { Schedule, ScheduleExecutionResult } from "./types.js";
import { generateExecutionId } from "./ScheduleContext.js";

export function buildScheduleResult(
  schedule: Schedule,
  status: ScheduleExecutionResult["status"],
  options?: {
    error?: string;
    attempt?: number;
    triggeredAt?: Date;
  },
): ScheduleExecutionResult {
  const triggeredAt = options?.triggeredAt ?? new Date();
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - triggeredAt.getTime();

  return {
    executionId: generateExecutionId(),
    scheduleId: schedule.id,
    scheduleName: schedule.name,
    triggeredAt,
    completedAt,
    durationMs,
    status,
    error: options?.error,
    attempt: options?.attempt ?? 1,
  };
}
