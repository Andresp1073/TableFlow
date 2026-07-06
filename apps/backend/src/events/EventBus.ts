type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

interface EventHandlerEntry<T = unknown> {
  handler: EventHandler<T>;
  once: boolean;
}

export class EventBus {
  private handlers = new Map<string, EventHandlerEntry[]>();

  public on<T>(event: string, handler: EventHandler<T>): void {
    const entries = this.handlers.get(event) ?? [];
    entries.push({ handler: handler as EventHandler, once: false });
    this.handlers.set(event, entries);
  }

  public once<T>(event: string, handler: EventHandler<T>): void {
    const entries = this.handlers.get(event) ?? [];
    entries.push({ handler: handler as EventHandler, once: true });
    this.handlers.set(event, entries);
  }

  public off(event: string, handler: EventHandler): void {
    const entries = this.handlers.get(event);

    if (!entries) return;

    const filtered = entries.filter((entry) => entry.handler !== handler);

    if (filtered.length === 0) {
      this.handlers.delete(event);
    } else {
      this.handlers.set(event, filtered);
    }
  }

  public async emit<T>(event: string, payload: T): Promise<void> {
    const entries = this.handlers.get(event);

    if (!entries) return;

    const toRemove: EventHandler[] = [];

    for (const entry of entries) {
      try {
        await entry.handler(payload);
      } catch (error) {
        console.error(`[EventBus] Error in handler for "${event}":`, error);
      }

      if (entry.once) {
        toRemove.push(entry.handler);
      }
    }

    if (toRemove.length > 0) {
      const remaining = entries.filter((entry) => !toRemove.includes(entry.handler));
      if (remaining.length === 0) {
        this.handlers.delete(event);
      } else {
        this.handlers.set(event, remaining);
      }
    }
  }

  public clear(): void {
    this.handlers.clear();
  }

  public listenerCount(event: string): number {
    return this.handlers.get(event)?.length ?? 0;
  }
}

export const eventBus = new EventBus();
