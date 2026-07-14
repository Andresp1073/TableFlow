import type { ManualTriggerConfig } from "../types.js";

let triggerIdCounter = 0;

export class ManualTrigger {
  static create(options?: { id?: string }): ManualTriggerConfig {
    return {
      type: "manual",
      id: options?.id ?? `manual-${++triggerIdCounter}`,
    };
  }
}
