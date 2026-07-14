# Conflict Detection Pipeline

## Architecture

The Conflict Detection Pipeline implements a **Chain of Responsibility** pattern for detecting reservation conflicts. Each rule is an isolated unit with a single responsibility, processed sequentially by the pipeline orchestrator.

```
┌──────────────────────────────────────────────────────────┐
│              ReservationConflictPipeline                  │
│                  (Chain of Responsibility)                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  PipelineContext ──► TableConflictRule ──► (blocking?)   │
│                          │                               │
│                          ▼                               │
│                   TableGroupConflictRule ──► (blocking?) │
│                          │                               │
│                          ▼                               │
│                 RestaurantAvailabilityRule ──► (blocking?)│
│                          │                               │
│                          ▼                               │
│               ReservationTimeConflictRule ──► (blocking?)│
│                          │                               │
│                          ▼                               │
│              ReservationPolicyConflictRule ──► (blocking?)│
│                          │                               │
│                          ▼                               │
│                   FutureExtensionRule (placeholder)      │
│                          │                               │
│                          ▼                               │
│                   PipelineResult                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Chain of Responsibility**: Rules are executed in sequence. If a rule returns a `blocking` conflict, execution stops immediately.
- **Isolated Rules**: Each rule is self-contained with its own dependencies. Rules do not share state.
- **Severity Levels**: `info`, `warning`, `blocking` — allows callers to distinguish between advisory, soft, and hard conflicts.
- **No Infrastructure Exceptions**: Rules catch domain exceptions and convert them to `ConflictResult` values.
- **Open/Closed**: New rules can be added without modifying existing ones.

## Components

### ReservationConflictPipeline (`engine/conflict-pipeline/ReservationConflictPipeline.ts`)
The orchestrator. Accepts an ordered list of `ConflictRule` instances. Two evaluation modes:

- `evaluate()` — Stops at first `blocking` conflict, returns early.
- `evaluateAll()` — Runs all rules regardless of severity, returns aggregated results.

Returns `PipelineResult` containing:
- `hasConflict` — Whether any conflict was detected
- `severity` — The worst severity across all results
- `results` — All individual rule results
- `conflictingReservationIds` — Deduplicated list of conflicting reservation IDs
- `primaryReason` — The reason from the most severe conflict
- `primaryCode` — The code from the most severe conflict

### ConflictRule (`engine/conflict-pipeline/ConflictRule.ts`)
Interface that all rules implement:

```typescript
export interface ConflictRule {
  readonly name: string;
  evaluate(context: PipelineContext): Promise<ConflictResult>;
}
```

### PipelineContext (`engine/conflict-pipeline/ConflictRule.ts`)
The input context passed to each rule:

```typescript
export interface PipelineContext {
  restaurantId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  partySize: number;
  tableId?: string | null;
  tableGroupId?: string | null;
  diningAreaId?: string | null;
  tableTypeId?: string | null;
  excludeReservationId?: string;
}
```

### ConflictResult (`engine/conflict-pipeline/ConflictResult.ts`)
The output of each rule evaluation:

```typescript
export interface ConflictResult {
  isConflict: boolean;
  severity: ConflictSeverity;  // "info" | "warning" | "blocking"
  reason: string | null;
  code: string | null;
  metadata?: Record<string, unknown>;
}
```

Factory functions: `noConflict()`, `blockingConflict(code, reason, metadata?)`, `warningConflict(code, reason, metadata?)`, `infoConflict(code, reason, metadata?)`.

## Rules

### TableConflictRule
- **Code**: `TABLE_CONFLICT`
- **Severity**: `blocking`
- **Detection**: Overlapping reservations for the same physical table
- **Dependencies**: `ReservationRepository`
- **Skips when**: `tableId` is not provided

### TableGroupConflictRule
- **Code**: `TABLE_GROUP_CONFLICT`
- **Severity**: `blocking`
- **Detection**: Overlapping reservations for the same table group
- **Dependencies**: `ReservationRepository`
- **Skips when**: `tableGroupId` is not provided

### RestaurantAvailabilityRule
- **Code**: `RESTAURANT_AVAILABILITY`
- **Severity**: `blocking`
- **Detection**: Delegates to the existing `AvailabilityService` (which wraps the `AvailabilityEngine`)
- **Dependencies**: `AvailabilityService`
- **Reuses**: The full Chain of Responsibility from the Availability Engine (business hours, calendar exceptions, table status, etc.)

### ReservationTimeConflictRule
- **Code**: `TIME_CONFLICT` (blocking) / `TIME_WARNING` (warning)
- **Severity**: `blocking` if same table conflict, `warning` otherwise
- **Detection**: Overlapping time slots for reservations without table assignment
- **Dependencies**: `ReservationRepository`

### ReservationPolicyConflictRule
- **Code**: `PARTY_SIZE_POLICY`, `TIME_RANGE_POLICY`, `LARGE_PARTY_WARNING`
- **Severity**: `blocking` for violations, `warning` for large parties
- **Detection**: Validates party size bounds and time range validity
- **Dependencies**: `PartySize` value object, `ReservationTimeRange` value object, `ReservationPolicyEvaluator`
- **Domain exceptions caught**: `PartySize.create()` and `ReservationTimeRange.create()` domain errors are caught and converted to `ConflictResult`

### FutureExtensionRule
- **Code**: *(none)*
- **Severity**: `info` (always returns `noConflict`)
- **Purpose**: Placeholder for future conflict detection rules (overbooking, waitlist, auto-assignment, recurring reservations)

## Extension Points

The pipeline is designed to be extended with new rules without modifying existing code:

### Adding a New Rule
1. Create a class implementing `ConflictRule`
2. Add it to the rules array when constructing the pipeline
3. The pipeline handles ordering, early termination, and result aggregation

### Future Rule Examples

```typescript
// Overbooking tolerance
class OverbookingRule implements ConflictRule {
  readonly name = "overbooking";
  async evaluate(context: PipelineContext): Promise<ConflictResult> {
    // Check overbooking threshold and return warning or blocking
  }
}

// Waitlist eligibility
class WaitlistEligibilityRule implements ConflictRule {
  readonly name = "waitlist_eligibility";
  async evaluate(context: PipelineContext): Promise<ConflictResult> {
    // Return info conflict indicating waitlist availability
  }
}

// Customer duplicate prevention
class CustomerDuplicateRule implements ConflictRule {
  readonly name = "customer_duplicate";
  async evaluate(context: PipelineContext): Promise<ConflictResult> {
    // Check for overlapping reservations from the same customer
  }
}
```

### Custom Pipelines

The pipeline constructor accepts any array of `ConflictRule` instances, allowing different pipeline configurations for different scenarios:

```typescript
// Full pipeline for creation
const creationPipeline = new ReservationConflictPipeline([
  new TableConflictRule(repository),
  new TableGroupConflictRule(repository),
  new RestaurantAvailabilityRule(availabilityService),
  new ReservationTimeConflictRule(repository),
  new ReservationPolicyConflictRule(),
  new FutureExtensionRule(),
]);

// Minimal pipeline for quick checks
const quickCheck = new ReservationConflictPipeline([
  new RestaurantAvailabilityRule(availabilityService),
]);
```

## Usage

```typescript
import { ReservationConflictPipeline, TableConflictRule, RestaurantAvailabilityRule } from "./engine/conflict-pipeline/index.js";

const pipeline = new ReservationConflictPipeline([
  new TableConflictRule(repository),
  new RestaurantAvailabilityRule(availabilityService),
]);

const result = await pipeline.evaluate({
  restaurantId: "rest-1",
  date: new Date("2026-07-14"),
  startTime: new Date("2026-07-14T18:00:00Z"),
  endTime: new Date("2026-07-14T20:00:00Z"),
  partySize: 4,
  tableId: "table-1",
});

if (result.hasConflict && result.severity === "blocking") {
  throw new Error(result.primaryReason);
}
```

## Quality Attributes

- **Chain of Responsibility**: Rules execute sequentially, early exit on blocking
- **Single Responsibility**: Each rule detects one type of conflict
- **Open/Closed**: New rules added without modifying existing code
- **Dependency Inversion**: Rules depend on abstractions (interfaces)
- **No Infrastructure Exceptions**: Domain exceptions are caught and mapped to results
- **No `any` types**: Strict TypeScript throughout
- **No duplicated business rules**: Reuses existing domain services and value objects
