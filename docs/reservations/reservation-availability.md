# Reservation Availability Integration (Phase 12.5)

## Architecture

The Availability Integration bridges the Reservation module with the existing Table
Availability Engine following Clean Architecture and Dependency Inversion principles.

```
Reservation Module (application/ports)
  └── AvailabilityService (interface)
         │
         ▼
Reservation Module (application/services)
  ├── ReservationAvailabilityChecker
  └── AvailabilityMapper
         │
         ▼
Reservation Module (infrastructure/adapters)
  └── TableAvailabilityAdapter
         │
         ▼
Tables Module (domain/services/availability)
  └── AvailabilityEngine
        ├── RestaurantStatusEvaluator
        ├── BusinessHoursEvaluator
        ├── CalendarExceptionEvaluator
        ├── TableGroupEvaluator
        ├── TableActiveEvaluator
        ├── DiningAreaEvaluator
        ├── TableTypeEvaluator
        ├── TableStatusEvaluator
        ├── ReservationPolicyEvaluator
        └── FutureReservationEvaluator
```

## Dependency Inversion

- The Reservation module defines the `AvailabilityService` port (interface) in its
  application layer. This is the only dependency the reservation logic has.
- The `TableAvailabilityAdapter` implements this port by delegating to the existing
  `AvailabilityEngine` from the Tables module.
- No reservation domain or application code depends on the Tables module directly.

## Flow

### Before Create

```
Controller.create
  → ReservationAvailabilityChecker.checkBeforeCreate()
    → AvailabilityService.checkAvailability()
      → TableAvailabilityAdapter.checkAvailability()
        → AvailabilityEngine.evaluate()
          → [All evaluators run in sequence]
          → Returns { available, reason, metadata }
      → AvailabilityMapper.ensureAvailable()
        → Throws ReservationAvailabilityError if unavailable
    → Returns result
  → ReservationApplicationService.create()
  → Response
```

### Before Confirm

```
Controller.confirm
  → ReservationApplicationService.getById() (load existing reservation)
  → ReservationAvailabilityChecker.checkBeforeConfirm()
    → Uses existing reservation's date/time/partySize
    → Same flow as checkBeforeCreate
  → ReservationApplicationService.confirm()
  → Response
```

### Before Update

```
Controller.update
  → ReservationApplicationService.getById() (load existing reservation)
  → ReservationAvailabilityChecker.checkBeforeUpdate()
    → Merges updated fields with existing fields
    → Same flow as checkBeforeCreate
  → ReservationApplicationService.update()
  → Response
```

## Integration Points

| Aspect | Reused Component | Location |
|--------|-----------------|----------|
| Business Hours | `BusinessHoursEvaluator` | tables/domain/services/availability/evaluators/ |
| Holidays | `CalendarExceptionEvaluator` | tables/domain/services/availability/evaluators/ |
| Table Status | `TableStatusEvaluator` | tables/domain/services/availability/evaluators/ |
| Table Active | `TableActiveEvaluator` | tables/domain/services/availability/evaluators/ |
| Dining Area | `DiningAreaEvaluator` | tables/domain/services/availability/evaluators/ |
| Table Type | `TableTypeEvaluator` | tables/domain/services/availability/evaluators/ |
| Reservation Policy | `ReservationPolicyEvaluator` | tables/domain/services/availability/evaluators/ |
| Table Group | `TableGroupEvaluator` | tables/domain/services/availability/evaluators/ |
| Restaurant Status | `RestaurantStatusEvaluator` | tables/domain/services/availability/evaluators/ |
| Cache | `MemoryCacheProvider` | shared/cache/application/ |
| Audit | `AuditService` | audit/application/services/ |

## Components

### AvailabilityService (port)

File: `application/ports/AvailabilityService.ts`

```
interface AvailabilityCheckRequest {
  restaurantId: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  tableId?: string | null;
  diningAreaId?: string | null;
  tableTypeId?: string | null;
}

interface AvailabilityCheckResponse {
  available: boolean;
  reason: string | null;
  metadata?: Record<string, unknown>;
}

interface AvailabilityService {
  checkAvailability(request): Promise<AvailabilityCheckResponse>;
}
```

### ReservationAvailabilityChecker

File: `application/services/ReservationAvailabilityChecker.ts`

Application service that orchestrates availability checks before reservation
operations. Three entry points:

| Method | When Called | Input |
|--------|-------------|-------|
| `checkBeforeCreate` | Before creating a reservation | Full create input |
| `checkBeforeConfirm` | Before confirming a reservation | Same as create (uses reservation's own dates) |
| `checkBeforeUpdate` | Before updating a reservation | Merges updated + existing fields |

### AvailabilityMapper

File: `application/services/AvailabilityMapper.ts`

Translates availability results into reservation domain errors.

| Input | Output |
|-------|--------|
| `{ available: true }` | `null` (no error) |
| `{ available: false, reason: "..." }` | `ReservationAvailabilityError` |

### TableAvailabilityAdapter

File: `infrastructure/adapters/TableAvailabilityAdapter.ts`

Implements `AvailabilityService` by delegating to the `AvailabilityEngine`. Maps
reservation-centric fields (startTime, endTime) to engine-centric fields (date, time,
duration).

### ReservationAvailabilityError

File: `errors/ReservationAvailabilityError.ts`

Extends `BusinessError` with code `reservation.availability`. Carries the original
unavailability reason and metadata for structured error responses.

```
class ReservationAvailabilityError extends BusinessError {
  reason: string | null;
  metadata: Record<string, unknown> | undefined;
}
```

## Error Handling

Availability failures are translated into `ReservationAvailabilityError`. Internal
availability implementation details are never exposed to the caller. The error code
`reservation.availability` allows the API layer to map it to the appropriate HTTP
status code (422 Unprocessable Entity).

| Engine Reason | Error Message |
|---------------|---------------|
| `restaurant_closed` | "Reservation not available: restaurant_closed" |
| `outside_business_hours` | "Reservation not available: outside_business_hours" |
| `table_occupied` | "Reservation not available: table_occupied" |
| `party_size_exceeds_maximum` | "Reservation not available: party_size_exceeds_maximum" |
| `advance_booking_window` | "Reservation not available: advance_booking_window" |
| _(with metadata.message)_ | Uses the custom message from metadata |

## What Is NOT Duplicated

The following rules are NOT reimplemented in the Reservation module. They are
evaluated by the existing `AvailabilityEngine` evaluators:

- Business hours validation
- Holiday/calendar exception validation
- Table status checks (occupied, reserved, cleaning, maintenance, blocked)
- Table active/inactive/deleted/non-reservable checks
- Dining area active/non-reservable checks
- Table type active checks
- Reservation policy (party size limits, advance booking window)
- Table group occupancy check

## Examples

### Create reservation (availability check passes)

```typescript
const result = await checker.checkBeforeCreate({
  restaurantId: "rest-1",
  date: "2026-07-14",
  startTime: "2026-07-14T18:00:00Z",
  endTime: "2026-07-14T20:00:00Z",
  partySize: 4,
});
// -> { available: true, reason: null }
```

### Create reservation (availability check fails)

```typescript
try {
  await checker.checkBeforeCreate({
    restaurantId: "rest-1",
    date: "2026-07-14",
    startTime: "2026-07-14T18:00:00Z",
    endTime: "2026-07-14T20:00:00Z",
    partySize: 12,
  });
} catch (error) {
  // ReservationAvailabilityError:
  //   message: "Reservation not available: party_size_exceeds_maximum"
  //   reason: "party_size_exceeds_maximum"
  //   metadata: { partySize: 12, maxPartySize: 10 }
  //   code: "reservation.availability"
}
```
