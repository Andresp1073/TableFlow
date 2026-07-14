import type { CustomTriggerConfig } from "../types.js";

let triggerIdCounter = 0;

export class CustomTrigger {
  static create(
    customType: string,
    options?: { id?: string },
  ): CustomTriggerConfig {
    return {
      type: "custom",
      id: options?.id ?? `custom-${++triggerIdCounter}`,
      customType,
    };
  }
}
