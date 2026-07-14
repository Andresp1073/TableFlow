# Notification Orchestrator

## Architecture

The Notification Orchestrator is an event-driven system that listens to domain events and dispatches notifications across multiple channels. It follows Clean Architecture with pure abstractions for all external dependencies.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        NotificationOrchestrator                             │
│                         (Event Subscriber)                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Listens to:                                                               │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐ ┌───────────────┐   │
│  │Reservation   │ │Reservation    │ │Reservation   │ │Reservation    │   │
│  │Created       │ │Confirmed      │ │Cancelled     │ │Completed      │   │
│  └──────┬───────┘ └───────┬───────┘ └──────┬───────┘ └───────┬───────┘   │
│  ┌──────┴───────┐ ┌───────┴───────┐                                 │   │
│  │Reservation   │ │Waitlist       │                                 │   │
│  │NoShow        │ │Promoted       │                                 │   │
│  └──────────────┘ └───────────────┘                                 │   │
│                                                                      │   │
│  ┌──────────────────────────────────────────────────────────────────┐ │   │
│  │                    NotificationDispatcher                         │ │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │ │   │
│  │  │ChannelResolver   │  │TemplateResolver  │  │Queue          │  │ │   │
│  │  │- resolve()       │  │- resolve()       │  │- enqueue()    │  │ │   │
│  │  └──────────────────┘  └──────────────────┘  └───────┬───────┘  │ │   │
│  └───────────────────────────────────────────────────────┼──────────┘ │   │
│                                                          │             │   │
│  ┌──────────────────────────────────────────────────────────┐          │   │
│  │              Channel Providers (interfaces)               │          │   │
│  │  ┌───────┐ ┌───────┐ ┌─────────┐ ┌────┐ ┌────────┐ ┌──┐ │          │   │
│  │  │Email  │ │ SMS   │ │WhatsApp │ │Push│ │Webhook │ │In │ │          │   │
│  │  │       │ │       │ │         │ │    │ │        │ │App│ │          │   │
│  │  └───────┘ └───────┘ └─────────┘ └────┘ └────────┘ └──┘ │          │   │
│  └──────────────────────────────────────────────────────────┘          │   │
│                                                                        │   │
│  Dependencies:                                                         │   │
│  ┌────────────────┐                                                    │   │
│  │   EventBus     │                                                    │   │
│  └────────────────┘                                                    │   │
└────────────────────────────────────────────────────────────────────────┘
```

## Components

### NotificationOrchestrator (`notifications/NotificationOrchestrator.ts`)
Event subscriber that listens to domain events and delegates to the dispatcher.
- `start()` — Subscribes to all reservation events
- `stop()` — Unsubscribes from all events
- `handleExternalEvent()` — Allows manual/custom event dispatch

Supported events:
- `ReservationCreated`
- `ReservationConfirmed`
- `ReservationCancelled`
- `ReservationCompleted`
- `ReservationNoShow`
- `WaitlistPromoted` (via `handleExternalEvent`)

### NotificationDispatcher (`notifications/NotificationDispatcher.ts`)
Coordinates the full notification lifecycle:
1. Resolves channels via `NotificationChannelResolver`
2. Resolves templates via `NotificationTemplateResolver`
3. Creates `NotificationMessage` for each channel
4. Sends via registered `NotificationChannelProvider` or queues for later
5. Returns aggregated `NotificationResult`

### NotificationChannelResolver (`notifications/NotificationChannelResolver.ts`)
Determines which channels to use for each event type:

| Event Type | Default Channels |
|-----------|-----------------|
| ReservationCreated | email, sms, in_app |
| ReservationConfirmed | email, in_app |
| ReservationCancelled | email, in_app |
| ReservationCompleted | in_app |
| ReservationNoShow | email, in_app |
| WaitlistPromoted | sms, email, push, in_app |

Filters channels based on recipient availability:
- `email` requires `customerEmail`
- `sms`/`whatsapp` requires `customerPhone`
- `push`/`webhook`/`in_app` always available

Supports custom overrides via constructor or `withOverrides()`.

### NotificationTemplateResolver (`notifications/NotificationTemplateResolver.ts`)
Resolves message templates for each event+channel combination:
- Returns rich templates with `{placeholders}` for dynamic data
- Falls back to generic "Notification: {eventType}" for unknown combinations
- Supports all standard template placeholders

### NotificationQueue (`notifications/NotificationQueue.ts`)
Abstract queue interface for asynchronous notification processing:
- `enqueue()` — Add notification to queue
- `dequeue()` — Remove and return next notification
- `peek()` — View next without removing
- `remove()` — Remove specific notification
- `length()` — Queue size
- `clear()` — Empty queue

Comes with `InMemoryNotificationQueue` implementation. The interface supports future providers:
- Kafka
- RabbitMQ
- Redis Streams
- AWS SQS/SNS
- Azure Service Bus
- Google Pub/Sub

### NotificationChannelProvider (`notifications/NotificationChannelProvider.ts`)
Abstract provider interface:
- `channelType` — Channel identifier
- `send(message)` — Send and return delivery result

Providers are NOT implemented:
- Email (SendGrid, AWS SES, Mailgun, etc.)
- SMS (Twilio, AWS SNS, etc.)
- WhatsApp (Twilio, WhatsApp Business API)
- Push (Firebase, APNs)
- Webhook
- In-App

### NotificationResult (`notifications/NotificationResult.ts`)
Result type with factory functions:
- `successful()` — All channels sent
- `partial()` — Some channels sent, some failed
- `failed()` — All channels failed
- `skipped()` — No channels resolved or no recipient

## Notification Workflow

```
1. Domain event emitted → EventBus
2. NotificationOrchestrator receives event
3. NotificationDispatcher.dispatch() called
4. ChannelResolver resolves channels
5. TemplateResolver resolves templates per channel
6. For each channel:
   a. If provider registered → send immediately
   b. If no provider → queue for later processing
7. Dispatcher. processQueue() → sends queued messages
8. Aggregated NotificationResult returned
```

## Channel Provider Integration Example

```typescript
import type { NotificationChannelProvider, NotificationMessage, ChannelDeliveryResult } from "./types.js";

class SendGridEmailProvider implements NotificationChannelProvider {
  readonly channelType = "email";

  async send(message: NotificationMessage): Promise<ChannelDeliveryResult> {
    try {
      const result = await sendgrid.send({
        to: message.recipient.email,
        subject: message.template.subject,
        body: message.template.body,
      });

      return {
        status: "sent",
        channel: "email",
        messageId: message.id,
        providerMessageId: result.id,
        deliveredAt: new Date(),
      };
    } catch (error) {
      return {
        status: "failed",
        channel: "email",
        messageId: message.id,
        error: error.message,
        deliveredAt: new Date(),
      };
    }
  }
}

// Register
dispatcher.registerProvider(new SendGridEmailProvider());
```

## Queue Provider Integration Example

```typescript
import type { NotificationQueue, QueuedNotification } from "./types.js";

class KafkaNotificationQueue implements NotificationQueue {
  constructor(private readonly producer: KafkaProducer) {}

  async enqueue(notification: QueuedNotification): Promise<void> {
    await this.producer.send({
      topic: "notifications",
      value: JSON.stringify(notification),
    });
  }

  async dequeue(): Promise<QueuedNotification | null> {
    // Kafka consumer logic
  }
  // ...
}
```

## Usage

```typescript
import { EventBus } from "./events/EventBus.js";
import {
  NotificationOrchestrator,
  NotificationDispatcher,
  DefaultNotificationChannelResolver,
  DefaultNotificationTemplateResolver,
  InMemoryNotificationQueue,
} from "./modules/restaurant/notifications/index.js";

const eventBus = new EventBus();

const orchestrator = new NotificationOrchestrator({
  eventBus,
  dispatcher: new NotificationDispatcher(
    new DefaultNotificationChannelResolver(),
    new DefaultNotificationTemplateResolver(),
    new InMemoryNotificationQueue(),
    [
      // Register channel providers here
    ],
  ),
});

// Start listening
orchestrator.start();

// Queue processor (run on a timer or worker)
setInterval(async () => {
  await orchestrator["dispatcher"].processQueue();
}, 5000);

// Stop when shutting down
orchestrator.stop();
```

## Quality Attributes

- **DDD**: Event-driven design aligned with domain events
- **SOLID**: Single Responsibility per component, Open/Closed for providers
- **Strategy Pattern**: Channel resolution and template resolution
- **Factory Pattern**: NotificationResult factory functions
- **Dependency Inversion**: All external dependencies are interfaces
- **No provider implementations**: Pure abstractions for email, SMS, push, etc.
- **No duplicated business logic**: Uses existing domain events and EventBus
