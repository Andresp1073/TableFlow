import type {
  EventHandlerInterface,
  EventHandlerRegistryInterface,
  HandlerRegistration,
} from "./types.js";

export type { EventHandlerInterface };

export class EventHandlerRegistry implements EventHandlerRegistryInterface {
  private readonly registrations = new Map<string, HandlerRegistration[]>();

  register(handler: EventHandlerInterface, options?: Partial<HandlerRegistration>): void {
    const existing = this.registrations.get(handler.eventType) ?? [];

    const registration: HandlerRegistration = {
      handler,
      priority: options?.priority ?? 0,
      maxRetries: options?.maxRetries ?? 0,
      retryDelayMs: options?.retryDelayMs ?? 1_000,
    };

    existing.push(registration);
    existing.sort((a, b) => b.priority - a.priority);

    this.registrations.set(handler.eventType, existing);
  }

  unregister(eventType: string, handlerName: string): void {
    const entries = this.registrations.get(eventType);

    if (!entries) {
      return;
    }

    const filtered = entries.filter((r) => r.handler.handlerName !== handlerName);

    if (filtered.length === 0) {
      this.registrations.delete(eventType);
    } else {
      this.registrations.set(eventType, filtered);
    }
  }

  getRegistrations(eventType: string): HandlerRegistration[] {
    return this.registrations.get(eventType) ?? [];
  }

  hasHandler(eventType: string, handlerName: string): boolean {
    const entries = this.registrations.get(eventType);

    if (!entries) {
      return false;
    }

    return entries.some((r) => r.handler.handlerName === handlerName);
  }

  listEventTypes(): string[] {
    return Array.from(this.registrations.keys());
  }

  listHandlers(eventType?: string): HandlerRegistration[] {
    if (eventType) {
      return this.getRegistrations(eventType);
    }

    const all: HandlerRegistration[] = [];

    for (const entries of this.registrations.values()) {
      all.push(...entries);
    }

    return all;
  }

  clear(): void {
    this.registrations.clear();
  }

  count(): number {
    let total = 0;

    for (const entries of this.registrations.values()) {
      total += entries.length;
    }

    return total;
  }
}
