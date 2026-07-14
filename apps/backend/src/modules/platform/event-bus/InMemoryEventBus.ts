import type {
  Event,
  EventBus as EventBusInterface,
  EventHandler,
  EventBusStats,
  DispatchResult,
  Logger,
} from "./types.js";
import { EventHandlerRegistry } from "./EventHandlerRegistry.js";
import { EventDispatcher } from "./EventDispatcher.js";

export class InMemoryEventBus implements EventBusInterface {
  private readonly registry: EventHandlerRegistry;
  private readonly dispatcher: EventDispatcher;
  private readonly logger: Logger | null;
  private totalEventsPublished = 0;
  private totalHandlersExecuted = 0;
  private failedHandlers = 0;
  private startedAt: number = 0;
  private running = false;

  constructor(options?: { logger?: Logger }) {
    this.registry = new EventHandlerRegistry();
    this.dispatcher = new EventDispatcher();
    this.logger = options?.logger ?? null;
  }

  getRegistry(): EventHandlerRegistry {
    return this.registry;
  }

  getDispatcher(): EventDispatcher {
    return this.dispatcher;
  }

  async start(): Promise<void> {
    this.startedAt = Date.now();
    this.running = true;

    this.logger?.info("EventBus started", { timestamp: new Date().toISOString() });
  }

  async stop(): Promise<void> {
    this.running = false;

    this.logger?.info("EventBus stopped", { timestamp: new Date().toISOString() });
  }

  async publish(event: Event): Promise<void> {
    if (!this.running) {
      throw new Error("EventBus is not running. Call start() before publishing events.");
    }

    this.totalEventsPublished++;

    const registrations = this.registry.getRegistrations(event.type);

    if (registrations.length === 0) {
      return;
    }

    const result = await this.dispatcher.dispatchAll(event, registrations, this.logger ?? undefined);

    this.totalHandlersExecuted += result.handlersExecuted;
    this.failedHandlers += result.handlersFailed;

    if (result.errors.length > 0) {
      this.logger?.warn(`Event ${event.type} published with handler errors`, {
        eventId: event.id,
        errors: result.errors.length,
        failed: result.handlersFailed,
        executed: result.handlersExecuted,
      });
    }
  }

  async publishMany(events: Event[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribe(handler: EventHandler): void {
    this.registry.register(handler);

    this.logger?.info(`Handler "${handler.handlerName}" subscribed to "${handler.eventType}"`, {
      eventType: handler.eventType,
      handlerName: handler.handlerName,
      mode: handler.mode,
    });
  }

  unsubscribe(eventType: string, handlerName: string): void {
    this.registry.unregister(eventType, handlerName);
  }

  hasSubscriber(eventType: string, handlerName: string): boolean {
    return this.registry.hasHandler(eventType, handlerName);
  }

  subscriberCount(eventType: string): number {
    return this.registry.getRegistrations(eventType).length;
  }

  clear(): void {
    this.registry.clear();
    this.totalEventsPublished = 0;
    this.totalHandlersExecuted = 0;
    this.failedHandlers = 0;
  }

  getStats(): EventBusStats {
    return {
      totalEventsPublished: this.totalEventsPublished,
      totalHandlersExecuted: this.totalHandlersExecuted,
      failedHandlers: this.failedHandlers,
      registeredHandlers: this.registry.count(),
      uptimeMs: this.startedAt > 0 ? Date.now() - this.startedAt : 0,
    };
  }

  isRunning(): boolean {
    return this.running;
  }
}
