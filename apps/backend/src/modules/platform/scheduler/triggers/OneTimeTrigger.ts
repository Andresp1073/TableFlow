import type { OneTimeTriggerConfig } from "../types.js";

let triggerIdCounter = 0;

export class OneTimeTrigger {
  static create(
    runAt: Date,
    options?: { id?: string },
  ): OneTimeTriggerConfig {
    return {
      type: "one-time",
      id: options?.id ?? `one-time-${++triggerIdCounter}`,
      runAt,
    };
  }
}
