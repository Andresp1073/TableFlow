# Reservation Engine

## Architecture

The Reservation Engine is the core orchestration layer of the reservation system. It implements a **Coordinator Pattern** over the existing domain services, providing a clean separation between:

- **Domain Layer** – Business rules, value objects, state machine, validators
- **Engine Layer** – Workflow orchestration, conflict detection, policy evaluation
- **Application Layer** – Commands, queries, DTOs, mappers (existing `ReservationApplicationService`)
- **Infrastructure Layer** – Persistence, adapters, DI

The engine follows **Clean Architecture** and **Dependency Inversion** principles. All components depend on abstractions (interfaces), not concrete implementations.

```
┌─────────────────────────────────────────────┐
│              ReservationEngine               │
│              (Orchestrator)                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Creator  │  │ Updater  │  │Canceller │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │Confirmer │  │ CheckIn  │  │Completion│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │              │              │       │
│  ┌────┴──────────────┴──────────────┴────┐ │
│  │      Coordinators & Resolvers         │ │
│  │  ┌─────────┐ ┌───────────┐ ┌───────┐  │ │
│  │  │Validator│ │Conflict   │ │Policy │  │ │
│  │  │         │ │Resolver   │ │Eval.  │  │ │
│  │  └─────────┘ └───────────┘ └───────┘  │ │
│  │  ┌──────────────────────────────┐     │ │
│  │  │ StateMachineCoordinator      │     │ │
│  │  └──────────────────────────────┘     │ │
│  └───────────────────────────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│              Domain Services                │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ │
│  │State     │ │Time        │ │Policy    │ │
│  │Machine   │ │Validator   │ │Validator │ │
│  └──────────┘ └────────────┘ └──────────┘ │
├─────────────────────────────────────────────┤
│           Infrastructure                    │
│  ┌──────────────┐ ┌────────────────────┐   │
│  │Repositories  │ │AvailabilityAdapter │   │
│  └──────────────┘ └────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Components

### ReservationEngine (`engine/ReservationEngine.ts`)
Main orchestrator. Creates and wires all sub-components. Exposes methods:
- `create()` – Creates a new reservation
- `update()` – Updates reservation details
- `cancel()` – Cancels a reservation
- `confirm()` – Confirms a pending reservation
- `checkInCommand()` – Processes customer arrival
- `complete()` – Closes reservation lifecycle
- `getById()` – Retrieves reservation by ID
- `list()` – Lists reservations with filters
- `search()` – Searches reservations

### ReservationCreator (`engine/creator/ReservationCreator.ts`)
Orchestrates the creation workflow:
1. Validates the create command
2. Builds domain value objects
3. Evaluates business policies
4. Checks for time/table conflicts
5. Verifies availability
6. Persists via repository
7. Emits domain events
8. Records audit trail
9. Invalidates cache

### ReservationUpdater (`engine/updater/ReservationUpdater.ts`)
Orchestrates the update workflow:
1. Loads existing reservation
2. Validates update constraints
3. Detects conflicts for changed time/table
4. Applies partial updates
5. Persists changes
6. Records audit trail
7. Invalidates cache

### ReservationCanceller (`engine/canceller/ReservationCanceller.ts`)
Orchestrates cancellation:
1. Loads existing reservation
2. Validates state transition via state machine
3. Sets cancelled timestamp
4. Persists changes
5. Emits ReservationCancelled event
6. Records audit trail

### ReservationConfirmer (`engine/confirmer/ReservationConfirmer.ts`)
Orchestrates confirmation:
1. Loads existing reservation
2. Verifies availability (if table assigned)
3. Validates state transition
4. Persists changes
5. Emits ReservationConfirmed event
6. Records audit trail

### ReservationCheckIn (`engine/check-in/ReservationCheckIn.ts`)
Orchestrates check-in:
1. Loads existing reservation
2. Validates state transition
3. Persists changes
4. Records audit trail

### ReservationCompletion (`engine/completion/ReservationCompletion.ts`)
Orchestrates completion:
1. Loads existing reservation
2. Validates state transition
3. Persists changes
4. Emits ReservationCompleted event
5. Records audit trail

### ReservationStateMachineCoordinator (`engine/state-machine/ReservationStateMachineCoordinator.ts`)
Wrapper around the domain `ReservationStateMachine`. Adds:
- `requireTransition()` – Validates and throws with a descriptive error
- Delegates all transitions to the domain state machine

### ReservationConflictResolver (`engine/conflict/ReservationConflictResolver.ts`)
Detects scheduling conflicts:
- Table-level time conflicts
- Table group time conflicts
- Excludes own reservation during updates
- Ignores non-active reservations (cancelled, completed, no-show)

### ReservationValidator (`engine/validation/ReservationValidator.ts`)
Coordinates input validation:
- Required field checking
- Party size bounds
- Time range validity
- Terminal state protection for updates

### ReservationPolicyEvaluator (`engine/policy/ReservationPolicyEvaluator.ts`)
Coordinates business policy evaluation:
- Party size validation
- Time range validation
- Source validation
- Large party warnings
- Non-customer-facing source warnings

## Dependencies

The engine reuses existing modules:

| Dependency | Source |
|---|---|
| Reservation State Machine | `domain/services/ReservationStateMachine.ts` |
| Time Validator | `domain/services/ReservationTimeValidator.ts` |
| Policy Validator | `domain/services/ReservationPolicyValidator.ts` |
| Reservation Repository | `domain/repositories/ReservationRepository.ts` |
| Reservation Factory | `domain/repositories/ReservationFactory.ts` |
| Event Bus | `events/EventBus.ts` |
| Audit Service | `audit/application/services/AuditService.ts` |
| Availability Service | `application/ports/AvailabilityService.ts` |
| Cache Invalidator | `application/services/ReservationCacheInvalidator.ts` |
| Domain Events | `domain/events/ReservationEvents.ts` |
| Value Objects | `domain/models/*` |
| Error Classes | `errors/*` |

## Extension Points

The engine is designed for future extensions without modification:

### Table Conflicts
The `ReservationConflictResolver` already supports table-level conflict detection. To extend:
- Add more granular table capacity checks
- Support multi-table assignments

### Table Group Conflicts
The conflict resolver checks `tableGroupId` for overlapping reservations. To extend:
- Add group-level capacity constraints
- Support partial group assignments

### Overbooking Rules
Override the conflict resolver or add an overbooking policy evaluator:
- `ReservationPolicyEvaluator` can be extended with overbooking tolerance
- A new evaluator can be injected into the creation/confirmation pipeline

### Waitlist
Add a `WaitlistManager` that wraps the engine:
- On `create()` failure due to conflict → add to waitlist
- On `cancel()` or `complete()` → check waitlist for auto-assignment

### Auto-Assignment
Add an `AutoAssigner` strategy:
- Injected between validation and persistence in `ReservationCreator`
- Selects optimal table/table-group based on party size, time, and preferences

### Custom Validation Rules
Add new validation methods to `ReservationValidator`:
- Customer duplicate detection
- Restaurant-specific policies
- Time-of-day restrictions

### Custom Policy Rules
Add new evaluation methods to `ReservationPolicyEvaluator`:
- Minimum notice period
- Maximum advance booking
- Source-based restrictions

## Workflow

### Standard Reservation Flow
```
Create → Confirm → CheckIn → Complete
```

### Cancellation Flow
```
Create/Create → Confirm → Cancel
```

### State Transitions

```
pending      → confirmed, cancelled, no_show
confirmed    → checked_in, cancelled, no_show, completed
checked_in   → seated, cancelled
seated       → completed, no_show
completed    → (terminal)
cancelled    → (terminal)
no_show      → (terminal)
```

## Usage

```typescript
import { ReservationEngine } from "./engine/ReservationEngine.js";

const engine = new ReservationEngine({
  repository,
  factory,
  eventBus,
  auditService,
  availabilityService,
  cacheInvalidator,
});

const result = await engine.create(
  {
    restaurantId: "rest-1",
    reservationNumber: "RES-001",
    date: "2026-07-14",
    startTime: "2026-07-14T18:00:00Z",
    endTime: "2026-07-14T20:00:00Z",
    partySize: 4,
    source: "website",
  },
  { auth: authorizationContext },
);
```

## Quality Attributes

- **DDD** – Each component has a single domain responsibility
- **SOLID** – Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **Strategy Pattern** – Policy evaluation, conflict resolution
- **Coordinator Pattern** – State machine coordinator delegates to domain service
- **No `any` types** – Strict TypeScript throughout
- **No duplicated business rules** – All domain logic resides in existing domain services
