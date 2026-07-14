import type { Logger } from "../observability/types.js";

export interface Event {
  readonly id: string;
  readonly type: string;
  readonly occurredAt: Date;
  readonly metadata: EventMetadata;
  readonly payload: Record<string, unknown>;
}

export interface EventMetadata {
  readonly correlationId: string;
  readonly causationId?: string;
  readonly userId?: string;
  readonly tenantId?: string;
  readonly source?: string;
  readonly version: number;
  readonly timestamp: string;
  readonly custom?: Record<string, unknown>;
}

export interface DomainEvent extends Event {
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly domainVersion: number;
}

export interface ApplicationEvent extends Event {
  readonly application: string;
  readonly environment?: string;
}

export interface IntegrationEvent extends Event {
  readonly destination?: string;
  readonly schemaVersion: number;
  readonly sourceService: string;
}

export type AnyEvent = Event | DomainEvent | ApplicationEvent | IntegrationEvent;

export type HandlerMode = "sync" | "async";

export interface EventHandler<T extends Event = Event> {
  readonly handlerName: string;
  readonly eventType: string;
  readonly mode: HandlerMode;
  handle(event: T): Promise<void>;
}

export interface HandlerRegistration {
  handler: EventHandler;
  priority: number;
  maxRetries: number;
  retryDelayMs: number;
}

export interface EventPublisher {
  publish(event: Event): Promise<void>;
  publishMany(events: Event[]): Promise<void>;
}

export interface EventSubscriber {
  subscribe(handler: EventHandler): void;
  unsubscribe(eventType: string, handlerName: string): void;
  hasSubscriber(eventType: string, handlerName: string): boolean;
  subscriberCount(eventType: string): number;
}

export interface EventBus extends EventPublisher, EventSubscriber {
  start(): Promise<void>;
  stop(): Promise<void>;
  clear(): void;
  getStats(): EventBusStats;
  getDispatcher(): EventDispatcherInterface;
}

export interface EventBusStats {
  totalEventsPublished: number;
  totalHandlersExecuted: number;
  failedHandlers: number;
  registeredHandlers: number;
  uptimeMs: number;
}

export interface DispatchResult {
  eventId: string;
  eventType: string;
  handlersExecuted: number;
  handlersFailed: number;
  errors: Array<{ handlerName: string; error: string; retryable: boolean }>;
  duration: number;
}

export interface EventDispatcherInterface {
  dispatch(event: Event, registrations: HandlerRegistration[], logger?: Logger): Promise<DispatchResult>;
  dispatchAsync(event: Event, registrations: HandlerRegistration[], logger?: Logger): Promise<DispatchResult>;
}

export interface EventBusProvider {
  readonly name: string;
  publish(event: Event): Promise<void>;
  publishMany(events: Event[]): Promise<void>;
  subscribe(handler: EventHandler): Promise<void>;
  unsubscribe(eventType: string, handlerName: string): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface EventHandlerRegistryInterface {
  register(handler: EventHandler, options?: Partial<HandlerRegistration>): void;
  unregister(eventType: string, handlerName: string): void;
  getRegistrations(eventType: string): HandlerRegistration[];
  hasHandler(eventType: string, handlerName: string): boolean;
  listEventTypes(): string[];
  listHandlers(eventType?: string): HandlerRegistration[];
  clear(): void;
  count(): number;
}
