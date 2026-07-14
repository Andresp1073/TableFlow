# Enterprise Scheduler

## Architecture

The Enterprise Scheduler provides a provider-agnostic scheduling platform for business modules. It follows Clean Architecture and Dependency Inversion — business modules depend only on the `Scheduler` interface.

```
┌─────────────────────────────────────────────────┐
│              Business Module (consumer)          │
│           depends on: Scheduler interface        │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│              ScheduleManager (orchestrator)      │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Registry │  │ TrigResolver │  │PolicyEng  │  │
│  └──────────┘  └──────────────┘  └───────────┘  │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│           Background Jobs Framework              │
│        (JobScheduler for actual execution)       │
└─────────────────────────────────────────────────┘
```

## Components

| Component | Responsibility |
|---|---|
| **ScheduleManager** | Orchestrates schedule registration, state transitions, trigger evaluation, policy enforcement, and job dispatch |
| **ScheduleRegistry** | Stores and queries schedules by name, ID, state, and trigger type |
| **TriggerResolver** | Evaluates trigger conditions to determine if a schedule should fire |
| **SchedulePolicyEngine** | Enforces execution policies (max executions, overlap, misfire handling, retry) |
| **ScheduleContext** | Builds execution context with execution ID, trigger metadata |
| **ScheduleResult** | Builds execution result objects for completed/failed/skipped/misfired executions |

## Trigger Types

| Trigger | Description | Auto-fire | Next Fire Time |
|---|---|---|---|
| **FixedInterval** | Fires every N milliseconds | ✓ | Computed: `lastTriggeredAt + intervalMs` |
| **Cron** | Fires based on cron expression (requires provider) | Requires provider | Requires provider |
| **OneTime** | Fires once at a specific Date | ✓ | `runAt` |
| **Startup** | Fires once on first tick | ✓ | null |
| **Manual** | Fires only via explicit `triggerSchedule()` | ✗ | null |
| **Event** | Fires when matching event received (requires event handler) | Requires handler | null |
| **Custom** | Fires via custom evaluation logic | Requires handler | null |

### Trigger Lifecycle

```
register ──► enabled ──► trigger condition met ──► policy check ──► job dispatch
                │                                        │
                ├── disabled (manual)                    ├── blocked by policy
                ├── paused   (manual)                    └── misfire handling
                ├── completed (max executions)
                └── failed   (execution error)
```

## Schedule States

```
    ┌──────────┐
    │  enabled │◄────────────┐
    └────┬─────┘             │
         │                   │
    ┌────▼─────┐    ┌────────┴───────┐
    │ disabled │    │    paused      │
    └──────────┘    └────────┬───────┘
                             │
    ┌──────────┐    ┌────────▼───────┐
    │completed │    │    failed      │
    └──────────┘    └────────────────┘
```

Transitions:
- `enabled` → `disabled`, `paused`, `completed`, `failed`
- `disabled` → `enabled`, `paused`
- `paused` → `enabled`
- `completed` → `enabled` (resets execution/misfire counters)
- `failed` → `enabled` (resets execution/misfire counters)

## Schedule Policies

### Max Executions
Limits the total number of times a schedule can fire. When `undefined`, unlimited executions are allowed.

### Execution Timeout
Maximum duration (in ms) a scheduled job is allowed to run before being considered timed out.

### Retry Policy
Configuration for retry behavior when execution fails:
- `maxRetries`: Maximum number of retry attempts
- `delayMs`: Initial delay before first retry
- `backoffMultiplier`: Exponential backoff factor applied to each subsequent retry (capped at 30 minutes)

### Overlap Policy
Controls behavior when a new trigger fires while a previous execution is still running:
- `skip`: Skip the new execution
- `queue`: Queue for execution after current completes
- `parallel`: Allow concurrent execution
- `terminate_previous`: Terminate the running execution and start new one

### Misfire Policy
Controls behavior when a trigger is missed (schedule was blocked by policy at fire time):
- `skip`: Skip the missed fire
- `execute_now`: Execute immediately despite policy block
- `execute_next`: Execute at the next scheduled interval

## Events

| Event | Description |
|---|---|
| `schedule.created` | A new schedule was registered |
| `schedule.triggered` | A schedule was triggered and dispatched to the job scheduler |
| `schedule.paused` | A schedule was paused |
| `schedule.resumed` | A schedule was resumed |
| `schedule.failed` | A schedule execution failed |

## Example Usage

```typescript
import { ScheduleManager, ScheduleRegistry, TriggerResolver, SchedulePolicyEngine } from "./scheduler/index.js";
import { FixedIntervalTrigger, OneTimeTrigger, StartupTrigger, ManualTrigger } from "./scheduler/triggers/index.js";

const registry = new ScheduleRegistry();
const resolver = new TriggerResolver();
const policy = new SchedulePolicyEngine();
const manager = new ScheduleManager(registry, resolver, policy);

manager.setJobScheduler(jobScheduler);
manager.setLogger(logger);
manager.setEventPublisher(eventBus);

// Register a recurring cleanup schedule
manager.registerSchedule({
  id: "cleanup-001",
  name: "CacheCleanup",
  trigger: FixedIntervalTrigger.create(300000, { id: "fi-cache" }),
  jobName: "cache-cleanup",
  jobData: { ttl: 3600000 },
  state: "enabled",
  policy: {
    executionTimeoutMs: 60000,
    retryPolicy: { maxRetries: 2, delayMs: 5000, backoffMultiplier: 2 },
    overlapPolicy: "skip",
    misfirePolicy: "skip",
  },
  tags: ["system", "cache"],
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  executionCount: 0,
  misfireCount: 0,
});

// Register a manual trigger
manager.registerSchedule({
  id: "manual-001",
  name: "ManualAudit",
  trigger: ManualTrigger.create({ id: "m-audit" }),
  jobName: "audit-export",
  jobData: {},
  state: "enabled",
  policy: {
    executionTimeoutMs: 120000,
    retryPolicy: { maxRetries: 0, delayMs: 0, backoffMultiplier: 1 },
    overlapPolicy: "skip",
    misfirePolicy: "skip",
  },
  tags: ["manual"],
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  executionCount: 0,
  misfireCount: 0,
});

// Trigger manually
await manager.triggerSchedule("ManualAudit");

// Check all enabled schedules
const results = await manager.checkSchedules();
```

## Placeholder Schedules

The following schedules are registered as placeholders by business modules:

| Schedule | Trigger Type | Job Name | Purpose |
|---|---|---|---|
| ReservationCleanup | FixedInterval | reservation-cleanup | Clean expired reservations |
| CacheCleanup | FixedInterval | cache-cleanup | Evict stale cache entries |
| AuditCleanup | FixedInterval | audit-cleanup | Rotate audit logs |
| SecretRotation | FixedInterval | secret-rotation | Rotate expiring secrets |
| MetricsAggregation | FixedInterval | metrics-aggregation | Aggregate and persist metrics |

## Future Providers

The Scheduler is designed to be extended with actual scheduling infrastructure:

- **Cron Provider**: Integrate with `node-cron`, `cron-parser`, or similar libraries for cron expression evaluation
- **Event Handler**: Subscribe to Event Bus events for `event` trigger types
- **Custom Evaluator**: Register custom trigger evaluation functions
- **Distributed Lock**: Add distributed locking for multi-instance deployments (prevents duplicate fire in clustered environments)
- **Persistence**: Store schedule state in database for crash recovery
- **Web Dashboard**: Expose schedule state for admin UI

## Error Handling

| Error | Code | Description |
|---|---|---|
| `ScheduleNotFoundError` | SCHEDULE_NOT_FOUND | Requested schedule does not exist |
| `ScheduleAlreadyExistsError` | SCHEDULE_ALREADY_EXISTS | Attempted to register duplicate schedule name |
| `ScheduleStateTransitionError` | SCHEDULE_INVALID_STATE_TRANSITION | Invalid state transition requested |
| `ScheduleTriggerError` | SCHEDULE_TRIGGER_ERROR | Trigger evaluation failed |
| `ScheduleExecutionError` | SCHEDULE_EXECUTION_FAILED | Job dispatch failed |
| `SchedulePolicyViolationError` | SCHEDULE_POLICY_VIOLATION | Policy blocked execution |
