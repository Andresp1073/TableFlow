import type { FixedIntervalTriggerConfig } from "../types.js";

let triggerIdCounter = 0;

export class FixedIntervalTrigger {
  static create(
    intervalMs: number,
    options?: { id?: string; delayStartMs?: number },
  ): FixedIntervalTriggerConfig {
    return {
      type: "fixed-interval",
      id: options?.id ?? `fixed-interval-${++triggerIdCounter}`,
      intervalMs,
      delayStartMs: options?.delayStartMs,
    };
  }
}
