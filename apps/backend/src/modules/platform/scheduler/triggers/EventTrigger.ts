import type { EventTriggerConfig } from "../types.js";

let triggerIdCounter = 0;

export class EventTrigger {
  static create(
    eventType: string,
    options?: { id?: string; filter?: Record<string, unknown> },
  ): EventTriggerConfig {
    return {
      type: "event",
      id: options?.id ?? `event-${++triggerIdCounter}`,
      eventType,
      filter: options?.filter,
    };
  }
}
