# Background Jobs Framework

## Architecture

The Background Jobs Framework provides a provider-agnostic abstraction for asynchronous job processing. Business modules depend only on the `JobScheduler` interface.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Background Jobs Module                              │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                         JobScheduler                              │       │
│  │  schedule() │ cancel() │ pause() │ resume() │ getStatus() │ list()│       │
│  └──────────────────────────────┬───────────────────────────────────┘       │
│                                 │                                            │
│  ┌──────────────────────────────┴───────────────────────────────────┐       │
│  │                       JobDispatcher                               │       │
│  │  dispatch() │ processNext() │ processAll() │ registerProvider()   │       │
│  └──────────────────────────────┬───────────────────────────────────┘       │
│                                 │                                            │
│  ┌──────────────────────────────┴───────────────────────────────────┐       │
│  │                        JobExecutor                               │       │
│  │  execute() │ canExecute() │ registry → handler resolution        │       │
│  └──────────────────────────────┬───────────────────────────────────┘       │
│                                 │                                            │
│  ┌──────────────────────────────┴───────────────────────────────────┐       │
│  │                      JobRegistry                                 │       │
│  │  register() │ unregister() │ getHandler() │ hasHandler()         │       │
│  └──────────────────────────────┬───────────────────────────────────┘       │
│                                 │                                            │
│  ┌──────────────────────────────┴───────────────────────────────────┐       │
│  │                      JobQueueProvider                             │       │
│  │  enqueue() │ dequeue() │ acknowledge() │ nack() │ requeue()      │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │   InMemoryJobQueue   │  │   RetryPolicy        │  │  JobContext      │  │
│  │   (testing/ dev)     │  │   - maxRetries        │  │  - logger        │  │
│  └──────────────────────┘  │   - exponentialBackoff│  │  - cache         │  │
│                            │   - fixedDelay        │  │  - abortSignal   │  │
│  Future Providers:         │   - deadLetter        │  │  - progress      │  │
│  ┌──────────┐ ┌────────┐  └──────────────────────┘  └──────────────────┘  │
│  │ BullMQ   │ │ RabbitMQ│                                                   │
│  ├──────────┤ ├────────┤                                                   │
│  │ AWS SQS  │ │ GCP CT │                                                   │
│  ├──────────┤ ├────────┤                                                   │
│  │ Temporal │ │ Azure Q│                                                   │
│  └──────────┘ └────────┘                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Module Location

```
src/modules/platform/jobs/
├── index.ts
├── types.ts
├── RetryPolicy.ts
├── JobRegistry.ts
├── JobExecutor.ts
├── JobDispatcher.ts
├── JobScheduler.ts
├── InMemoryJobQueue.ts
└── tests/
    ├── job-registry.spec.ts     # 6 tests
    ├── retry-policy.spec.ts     # 16 tests
    ├── job-executor.spec.ts     # 10 tests
    ├── job-dispatcher.spec.ts   # 10 tests
    └── job-scheduler.spec.ts    # 17 tests
```

## Job Lifecycle

```
                  ┌──────────┐
                  │  Pending │
                  └────┬─────┘
                       │ dispatch
                  ┌────▼─────┐
                  │  Running │
                  └────┬─────┘
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
      ┌─────────┐ ┌─────────┐ ┌──────────┐
      │Completed│ │  Failed │ │ Retrying │
      └─────────┘ └─────────┘ └────┬─────┘
                                    │ requeue
                              ┌────▼─────┐
                              │  Running │
                              └──────────┘

Pending ──cancel──► Cancelled
Running ──► Failed (no retries) ──► (dead-letter if enabled)
```

### Status Transitions

| From | To | Trigger |
|------|----|---------|
| `pending` | `running` | Dispatcher dequeues |
| `running` | `completed` | Handler returns `completed` |
| `running` | `retrying` | Handler throws / returns `retry` with retries remaining |
| `running` | `failed` | Handler throws / returns `failed` with no retries |
| `pending` | `cancelled` | `scheduler.cancel()` |
| `retrying` | `running` | Dispatcher dequeues requeued job |

## Job Interface

```typescript
interface Job {
  readonly id: JobId;
  readonly name: JobName;
  readonly type: JobType;        // immediate | delayed | scheduled | recurring | retryable
  readonly data: Record<string, unknown>;
  status: JobStatus;             // pending | running | completed | failed | cancelled | retrying
  readonly priority: JobPriority; // low | normal | high | critical
  readonly createdAt: Date;
  readonly scheduledAt: Date | null;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  retryCount: number;
  readonly maxRetries: number;
  error?: string;
  readonly tags: string[];
  readonly metadata: Record<string, unknown>;
}
```

## JobContext

Passed to every job handler:

| Property | Description |
|----------|-------------|
| `job` | The executing job |
| `logger` | Logger instance (Observability module) |
| `cache` | CacheProvider instance (Cache module) |
| `abortSignal` | AbortSignal for cancellation |
| `setProgress(n)` | Report progress (0–100) |
| `setMetadata(k, v)` | Attach metadata during execution |
| `getMetadata(k)` | Read metadata during execution |
| `getProgress()` | Current progress |

## RetryPolicy

| Policy | Factory Method | Behavior |
|--------|---------------|----------|
| **Default** | `RetryPolicy.default()` | 3 retries, 1s initial, 2x backoff, 30s max |
| **Exponential Backoff** | `RetryPolicy.exponentialBackoff(5, 1s, 60s)` | 5 retries, 2x multiplier, dead-letter enabled |
| **Fixed Delay** | `RetryPolicy.fixedDelay(3, 5s)` | 3 retries, constant 5s delay |
| **Custom** | `RetryPolicy.custom({...})` | Override individual fields |

### Key Methods

| Method | Description |
|--------|-------------|
| `computeNextDelay(policy, retryCount)` | Returns delay in ms (capped at `maxDelayMs`) |
| `shouldRetry(policy, retryCount)` | `true` if `retryCount < maxRetries` |
| `isRetryableError(policy, error)` | Matches error string against `retryableErrors` (all errors retryable if empty) |
| `toDeadLetter(policy)` | `true` if `deadLetterEnabled` |

### Backoff Formula

```
delay = min(initialDelayMs × backoffMultiplier^retryCount, maxDelayMs)
```

## JobRegistry

Allows modules to register job handlers without coupling:

```typescript
const registry = new JobRegistry();

// Module registers its handler
registry.register({
  jobName: "NotificationDispatch",
  async execute(context: JobContext): Promise<JobResult> {
    context.logger.info("Dispatching notification", { jobId: context.job.id });
    // ... business logic ...
    return { status: "completed" };
  },
});
```

## JobExecutor

Resolves handlers from the registry and executes them with proper error handling and retry logic:

- If handler throws → captured as error, checked against retry policy
- If handler returns `retry` → executor increments retryCount, sets status to `retrying`
- If `shouldRetry` returns false → status set to `failed`
- Injects `JobContext` with noop Logger and CacheProvider when not provided

## JobDispatcher

Bridges the queue provider and the executor:

1. `dispatch(job)` — enqueues a job
2. `processNext()` — dequeues and executes one job
3. `processAll()` — drains the queue

On completion: acknowledges the job. On retry: requeues with delay. On failure: acknowledges (moves to dead-letter or discards).

## JobScheduler

Primary API for business modules:

```typescript
const job = await scheduler.schedule({
  name: "ReservationReminder",
  data: { reservationId: "res-123", restaurantId: "rest-1" },
  type: "delayed",
  delayMs: 3600_000,             // 1 hour
  priority: "normal",
  retryPolicy: { maxRetries: 3, initialDelayMs: 5000 },
  tags: ["notifications", "email"],
  metadata: { source: "reservation-engine" },
});

// Lifecycle management
await scheduler.cancel(job.id);
await scheduler.pause(job.id);
await scheduler.resume(job.id);
const status = await scheduler.getStatus(job.id);
const jobs = await scheduler.list({ status: ["pending"], priority: "high" });
```

## InMemoryJobQueue

In-memory implementation of `JobQueueProvider`:

- Priority-ordered dequeuing (critical → high → normal → low)
- FIFO within same priority level
- Delayed job support (jobs become visible after `scheduledAt`)
- Processing set to prevent re-delivery
- `nack()` and `requeue()` for retry support

## Future Providers

Any of these queue providers can implement `JobQueueProvider`:

| Provider | Strategy | Use Case |
|----------|----------|----------|
| **BullMQ** | Redis-backed | Production-ready with scheduling, rate limiting |
| **RabbitMQ** | AMQP | Reliable delivery, complex routing |
| **AWS SQS** | Cloud-native | Serverless, auto-scaling |
| **Azure Queue Storage** | Cloud-native | Azure ecosystem |
| **Google Cloud Tasks** | Cloud-native | GCP ecosystem, HTTP targets |
| **Temporal** | Workflow engine | Long-running workflows, saga patterns |
| **Kafka** | Event streaming | High-throughput, replayable events |

## Example: Business Job Registration

```typescript
// In a business module (e.g., notifications)
import { JobRegistry, type JobContext, type JobResult } from "../platform/jobs/index.js";

export function registerNotificationJobs(registry: JobRegistry): void {
  registry.register({
    jobName: "NotificationDispatch",
    async execute(ctx: JobContext): Promise<JobResult> {
      const { notificationId, channel } = ctx.job.data as Record<string, string>;

      ctx.logger.info("Processing notification", { notificationId, channel });
      ctx.setProgress(50);

      // ... send notification ...

      ctx.setProgress(100);

      return { status: "completed", data: { delivered: true } };
    },
  });
}
```

## Design Principles

- **Provider-agnostic**: Business modules depend only on `JobScheduler`
- **Clean Architecture**: Queue providers are external, behind `JobQueueProvider` interface
- **SOLID**: Single responsibility per component (scheduler, dispatcher, executor, registry)
- **Strategy Pattern**: RetryPolicy with configurable backoff strategies
- **Factory Pattern**: RetryPolicy factory methods for common configurations
- **No business coupling**: Module knows nothing about notification, reservation, or audit logic
- **Strict TypeScript**: Full type safety, no `any` types
- **Testability**: InMemoryJobQueue for isolated unit tests
