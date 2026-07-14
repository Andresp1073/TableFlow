import type { CronTriggerConfig } from "../types.js";

let triggerIdCounter = 0;

export class CronTrigger {
  static create(
    expression: string,
    options?: { id?: string; timezone?: string },
  ): CronTriggerConfig {
    return {
      type: "cron",
      id: options?.id ?? `cron-${++triggerIdCounter}`,
      expression,
      timezone: options?.timezone,
    };
  }
}
