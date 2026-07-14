import type { StartupTriggerConfig } from "../types.js";

let triggerIdCounter = 0;

export class StartupTrigger {
  static create(options?: { id?: string; delayMs?: number }): StartupTriggerConfig {
    return {
      type: "startup",
      id: options?.id ?? `startup-${++triggerIdCounter}`,
      delayMs: options?.delayMs,
    };
  }
}
