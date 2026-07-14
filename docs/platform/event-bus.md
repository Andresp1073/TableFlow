# Internal Event Bus Foundation

## Architecture

The Event Bus module provides a DDD-aligned, provider-agnostic event-driven messaging backbone. Business modules publish domain events and subscribe handlers without coupling to any specific infrastructure.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Internal Event Bus Module                             │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐        │
│  │                       InMemoryEventBus                            │        │
│  │  publish() │ publishMany() │ subscribe() │ unsubscribe() │ clear()│        │
│  └─────────────────────────────┬────────────────────────────────────┘        │
│                                │                                             │
│  ┌─────────────────────────────┴────────────────────────────────────┐        │
│  │                      EventDispatcher                              │        │
│  │  dispatch() → sync handlers (sequential, error isolation)         │        │
│  │  dispatchAsync() → async handlers (parallel, Promise.allSettled)  │        │
│  │  dispatchAll() → sync + async combined                            │        │
│  └─────────────────────────────┬────────────────────────────────────┘        │
│                                │                                             │
│  ┌─────────────────────────────┴────────────────────────────────────┐        │
│  │                    EventHandlerRegistry                           │        │
│  │  register() │ unregister() │ getRegistrations() │ listHandlers()  │        │
│  │  Priority ordering │ Retry configuration per handler               │        │
│  └───────────────────────────────────────────────────────────────────┘        │
│                                                                               │
│  ┌───────────────────────┐  ┌────────────────────┐  ┌─────────────────────┐  │
│  │   Event / DomainEvent  │  │   EventMetadata    │  │  EventPublisher /   │  │
│  │   ApplicationEvent    │  │   - correlationId  │  │  EventSubscriber    │  │
│  │   IntegrationEvent    │  │   - causationId    │  │  (interfaces)        │  │
│  └───────────────────────┘  │   - userId         │  └─────────────────────┘  │
│                              │   - tenantId       │                          │
│  Future providers:          │   - source         │                          │
│  ┌──────┐ ┌────────┐       └────────────────────┘                          │
│  │Kafka │ │RabbitMQ│                                                        │
│  ├──────┤ ├────────┤                                                        │
│  │AWS   │ │Azure   │                                                        │
│  │SNS/  │ │Service │                                                        │
│  │SQS   │ │Bus     │                                                        │
│  ├──────┤ ├────────┤                                                        │
│  │Google│ │Redis   │                                                        │
│  │Pub/  │ │Streams │                                                        │
│  │Sub   │ │        │                                                        │
│  └──────┘ └────────┘                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Module Location

```
src/modules/platform/event-bus/
├── index.ts
├── types.ts                       # Core event, handler, bus interfaces
├── Event.ts                       # BaseEvent + DomainEvent implementations
├── EventMetadata.ts               # Metadata factory, id/correlationId generators
├── EventHandlerRegistry.ts        # Handler storage with priority ordering
├── EventDispatcher.ts             # Sync + async dispatch with error isolation
├── InMemoryEventBus.ts            # Full bus implementation
└── tests/
    ├── handler-registry.spec.ts   # 14 tests
    ├── event-dispatcher.spec.ts   # 9 tests
    ├── failure-isolation.spec.ts  # 5 tests
    └── event-bus.spec.ts          # 16 tests
```

## Event Model

### Event Interface (base for all events)

```typescript
interface Event {
  readonly id: string;              // Unique event identifier
  readonly type: string;            // Event type (e.g. "reservation.created")
  readonly occurredAt: Date;        // When the event happened
  readonly metadata: EventMetadata; // Correlation, causation, security context
  readonly payload: Record<string, unknown>; // Business data
}
```

### Event Types

| Type | Extends | Additional Fields | Use Case |
|------|---------|-------------------|----------|
| `Event` | — | — | Generic event |
| `DomainEvent` | `Event` | `aggregateId`, `aggregateType`, `domainVersion` | Aggregate state changes |
| `ApplicationEvent` | `Event` | `application`, `environment` | System-level events |
| `IntegrationEvent` | `Event` | `destination`, `schemaVersion`, `sourceService` | Cross-service communication |

### EventMetadata

```typescript
interface EventMetadata {
  readonly correlationId: string;   // Traces related events across services
  readonly causationId?: string;    // Links to the event that caused this one
  readonly userId?: string;         // Authenticated user who triggered the event
  readonly tenantId?: string;       // Multi-tenant context
  readonly source?: string;         // Source module or service name
  readonly version: number;         // Schema version for evolution
  readonly timestamp: string;       // ISO 8601 timestamp
  readonly custom?: Record<string, unknown>; // Extension point
}
```

## Publishing Flow

```
1. Business logic creates event
   └── new DomainEvent("reservation.created", "agg-123", "reservation", { ... })

2. EventBus.publish(event)
   ├── Validates bus is running
   ├── Increments totalEventsPublished counter
   ├── Looks up handler registrations by event.type
   └── Delegates to EventDispatcher.dispatchAll()

3. EventDispatcher.dispatchAll()
   ├── dispatch() → sync handlers (sequentially, one-by-one)
   │   └── If a handler throws → error is captured, next handler runs
   ├── dispatchAsync() → async handlers (in parallel via Promise.allSettled)
   │   └── If a handler throws → error is captured, others unaffected
   └── Returns aggregated DispatchResult

4. EventBus tracks stats
   ├── totalHandlersExecuted
   └── failedHandlers
```

### Handler Execution

| Mode | Execution | Order Guarantee | Failure Impact |
|------|-----------|-----------------|----------------|
| `sync` | Sequential | Yes (by priority) | Isolated — other handlers continue |
| `async` | Parallel (`Promise.allSettled`) | No | Isolated — other handlers continue |

## Handler Registration

```typescript
// Handler carries its own eventType and mode
const handler: EventHandler = {
  handlerName: "SendEmailOnReservation",
  eventType: "reservation.created",
  mode: "sync",         // or "async"
  async handle(event) {
    // business logic
  },
};

bus.subscribe(handler);

// With retry configuration via registry directly
bus.getRegistry().register(handler, {
  priority: 100,
  maxRetries: 3,
  retryDelayMs: 5000,
});
```

### Priority Ordering

Handlers are sorted by priority (descending). Higher priority handlers execute first for sync mode. Async handlers run in parallel regardless of priority.

## Failure Isolation

One failed handler never stops other handlers. The `EventDispatcher` guarantees:

- **Sync handlers**: Each handler is wrapped in try/catch. Failures are captured, logged, and the next handler runs.
- **Async handlers**: `Promise.allSettled` ensures all handlers complete regardless of individual failures.
- **Error reporting**: Each failed handler is recorded in `DispatchResult.errors` with the handler name, error message, and retryability flag.

```typescript
interface DispatchResult {
  eventId: string;
  eventType: string;
  handlersExecuted: number;
  handlersFailed: number;
  errors: Array<{
    handlerName: string;
    error: string;
    retryable: boolean;    // true if handler has maxRetries > 0
  }>;
  duration: number;
}
```

## Retry Preparation

Each handler registration supports:
- `maxRetries`: Maximum retry attempts (0 = no retry)
- `retryDelayMs`: Delay between retries (for queue-based dispatch)

When an error occurs, the `DispatchResult` marks `retryable: true` if `maxRetries > 0`, enabling external retry mechanisms (e.g., Background Jobs Framework) to requeue the event for reprocessing.

## InMemoryEventBus

Full implementation with:

| Method | Description |
|--------|-------------|
| `start()` | Activates the bus (must be called before publish) |
| `stop()` | Deactivates the bus |
| `publish(event)` | Publishes single event to all handlers |
| `publishMany(events)` | Publishes multiple events sequentially |
| `subscribe(handler)` | Registers a handler for its event type |
| `unsubscribe(eventType, handlerName)` | Removes a handler |
| `hasSubscriber(eventType, handlerName)` | Checks handler existence |
| `subscriberCount(eventType)` | Number of handlers for an event type |
| `clear()` | Resets all state (handlers, stats) |
| `getStats()` | Returns `EventBusStats` |
| `getRegistry()` | Returns the `EventHandlerRegistry` for advanced config |
| `getDispatcher()` | Returns the `EventDispatcher` for direct dispatch |

### Stats

```typescript
interface EventBusStats {
  totalEventsPublished: number;
  totalHandlersExecuted: number;
  failedHandlers: number;
  registeredHandlers: number;
  uptimeMs: number;
}
```

## Usage Examples

### Basic Publish / Subscribe

```typescript
const bus = new InMemoryEventBus();
await bus.start();

bus.subscribe({
  handlerName: "LogReservations",
  eventType: "reservation.created",
  mode: "sync",
  async handle(event) {
    console.log(`Reservation created: ${event.payload.reservationId}`);
  },
});

const event = new DomainEvent(
  "reservation.created",
  "agg-123",
  "reservation",
  { reservationId: "res-456", partySize: 4 },
);

await bus.publish(event);
```

### Error Isolation

```typescript
bus.subscribe({
  handlerName: "FailingHandler",
  eventType: "test.event",
  mode: "sync",
  async handle() { throw new Error("Something went wrong"); },
});

bus.subscribe({
  handlerName: "SuccessHandler",
  eventType: "test.event",
  mode: "sync",
  async handle() { /* this still runs */ },
});

await bus.publish(event);
// Both handlers execute. FailingHandler error is captured,
// SuccessHandler completes normally.
```

### Chained Events via Causation

```typescript
// Create first event
const reservationCreated = new DomainEvent(
  "reservation.created",
  "agg-123",
  "reservation",
  { reservationId: "res-456" },
);

// Create a chained event with causation link
const notificationRequested = new BaseEvent(
  "notification.requested",
  { template: "welcome" },
  EventMetadataFactory.fromEvent(reservationCreated, { source: "notifications" }),
);
// notificationRequested.metadata.causationId === reservationCreated.id
```

## Example Events (Placeholders)

These events are type examples only — no business handlers are implemented:

| Event Type | Category | Payload |
|-----------|----------|---------|
| `reservation.created` | Domain | `{ reservationId, restaurantId, partySize, time }` |
| `reservation.confirmed` | Domain | `{ reservationId, tableId, confirmedAt }` |
| `table.status.changed` | Domain | `{ tableId, restaurantId, previousStatus, newStatus }` |
| `customer.created` | Domain | `{ customerId, name, email }` |
| `notification.requested` | Application | `{ notificationId, channel, recipient }` |

## Future Providers

Any of these providers can implement `EventBusProvider`:

| Provider | Pattern | Use Case |
|----------|---------|----------|
| **Kafka** | Topic-based pub/sub | High-throughput event streaming, replay |
| **RabbitMQ** | Exchange/queue routing | Complex routing, reliable delivery |
| **AWS SNS/SQS** | Topic + queue | Serverless, auto-scaling, DLQ |
| **Azure Service Bus** | Topic/subscription | Azure ecosystem, sessions |
| **Google Pub/Sub** | Topic/push-pull | GCP ecosystem, exactly-once |
| **Redis Streams** | Consumer groups | Lightweight, low-latency |

## Design Principles

- **DDD**: DomainEvent with aggregateId, aggregateType, domainVersion
- **Event-Driven Architecture**: Decoupled publishers and subscribers
- **SOLID**: Single responsibility per component, open for provider extension
- **Observer Pattern**: EventBus as observable, handlers as observers
- **Error Isolation**: One failing handler never blocks others
- **No business coupling**: Module provides the backbone, not the business logic
- **Strict TypeScript**: Full type safety, no `any` types
- **Testability**: InMemoryEventBus for isolated unit tests
