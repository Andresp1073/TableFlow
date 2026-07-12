# Table Availability Engine (Phase 11.5)

## Purpose

The Table Availability Engine determines whether a table can be reserved at a given date/time for a given party size. It evaluates multiple factors in a short-circuit chain: the first blocking factor immediately returns `unavailable` with a reason code.

## Architecture

```
AvailabilityEngine
  └─ iterates over evaluators (ordered)
       ├─ RestaurantStatusEvaluator
       ├─ BusinessHoursEvaluator
       ├─ CalendarExceptionEvaluator
       ├─ TableActiveEvaluator
       ├─ DiningAreaEvaluator
       ├─ TableTypeEvaluator
       ├─ TableStatusEvaluator
       ├─ ReservationPolicyEvaluator
       └─ FutureReservationEvaluator (placeholder)
```

Each evaluator implements the `AvailabilityEvaluator` interface:

```typescript
interface AvailabilityEvaluator {
  readonly name: string;
  evaluate(context: AvailabilityContext): Promise<AvailabilityResult>;
}
```

## Evaluation Order

| # | Evaluator | Checks | Reason Codes |
|---|-----------|--------|-------------|
| 1 | RestaurantStatusEvaluator | Restaurant ID is present | `unknown` |
| 2 | BusinessHoursEvaluator | Day-of-week schedule, open/close times | `restaurant_closed`, `outside_business_hours` |
| 3 | CalendarExceptionEvaluator | Holidays, closures, special hours | `holiday`, `special_closure`, `emergency_closure`, `maintenance_closure` |
| 4 | TableActiveEvaluator | `isActive`, `deletedAt`, `isReservable` | `table_inactive`, `table_deleted`, `table_non_reservable` |
| 5 | DiningAreaEvaluator | Dining area status & reservable flag | `dining_area_inactive`, `dining_area_non_reservable` |
| 6 | TableTypeEvaluator | Table type status | `table_type_inactive` |
| 7 | TableStatusEvaluator | Current table FSM status | `table_occupied`, `table_reserved`, `table_cleaning`, `table_blocked`, `table_out_of_service`, `table_maintenance`, `table_archived` |
| 8 | ReservationPolicyEvaluator | Party size range, advance booking window | `party_size_exceeds_maximum`, `party_size_below_minimum`, `advance_booking_window`, `reservation_policy_disabled` |
| 9 | FutureReservationEvaluator | Placeholder for reservation conflict | (always available) |

## Domain Layer

### `domain/services/availability/`

| File | Description |
|------|-------------|
| `AvailabilityContext.ts` | Input parameters for a check |
| `AvailabilityResult.ts` | Result VO + helper constructors |
| `AvailabilityEvaluator.ts` | Evaluator interface |
| `AvailabilityEngine.ts` | Orchestrator — runs evaluators in order |
| `evaluators/*.ts` | One class per evaluation factor |

### AvailabilityResult

```typescript
type UnavailableReason =
  | "restaurant_closed" | "holiday" | "special_closure"
  | "maintenance_closure" | "emergency_closure"
  | "outside_business_hours"
  | "table_inactive" | "table_archived" | "table_deleted"
  | "table_non_reservable"
  | "table_occupied" | "table_reserved" | "table_cleaning"
  | "table_blocked" | "table_out_of_service" | "table_maintenance"
  | "dining_area_inactive" | "dining_area_archived" | "dining_area_non_reservable"
  | "table_type_inactive"
  | "party_size_exceeds_maximum" | "party_size_below_minimum"
  | "advance_booking_window" | "reservation_policy_disabled"
  | "future_reservation_conflict" | "unknown";

interface AvailabilityResult {
  available: boolean;
  reason: UnavailableReason | null;
  metadata?: Record<string, unknown>;
}
```

### AvailabilityEngine

```typescript
class AvailabilityEngine {
  constructor(evaluators: AvailabilityEvaluator[]);
  evaluate(context: AvailabilityContext): Promise<AvailabilityResult>;
  evaluateAll(context: AvailabilityContext): Promise<AvailabilityResult[]>;
}
```

## Application Layer

### `application/services/TableAvailabilityService.ts`

| Method | Description |
|--------|-------------|
| `checkTableAvailability(query, auth)` | Returns `available + reason` for one table |
| `checkTableAvailabilityDetailed(query, auth)` | Returns per-evaluator breakdown |
| `listAvailableTables(query, auth)` | Filters tables by criteria, returns availability for each |

### `application/services/TableAvailabilityCacheService.ts`

Caches business hours, calendar exceptions, reservation policies, and restaurant settings with 5-minute TTL.

| Method | Description |
|--------|-------------|
| `get/set/invalidateBusinessHours(id)` | Business hours cache |
| `get/set/invalidateCalendarExceptions(id, date)` | Calendar exceptions cache |
| `get/set/invalidateReservationPolicy(id)` | Reservation policy cache |
| `get/set/invalidateRestaurantSettings(id)` | Restaurant settings cache |

## Presentation Layer

### Endpoints

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| `GET` | `/api/v1/restaurants/:id/tables/availability` | List available tables with filters | `tables.read` |
| `GET` | `/api/v1/restaurants/:id/tables/:tableId/availability` | Check single table availability | `tables.read` |

### Query Parameters for `GET /tables/availability`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | YYYY-MM-DD | yes | Target date |
| `time` | HH:MM | no | Target time |
| `partySize` | number | no | Number of guests |
| `duration` | number | no | Reservation duration (minutes) |
| `diningAreaId` | UUID | no | Filter by dining area |
| `tableTypeId` | UUID | no | Filter by table type |
| `minCapacity` | number | no | Minimum table capacity |
| `maxCapacity` | number | no | Maximum table capacity |
| `isAccessible` | boolean | no | Filter accessible tables |

### Response for `GET /tables/availability`

```json
{
  "success": true,
  "data": {
    "availableTables": [
      { "tableId": "...", "available": true, "reason": null, "metadata": {} }
    ],
    "totalTables": 10,
    "availableCount": 8
  }
}
```

### Response for `GET /tables/:tableId/availability`

```json
{
  "success": true,
  "data": {
    "available": true,
    "reason": null
  }
}
```

## Cache Invalidation Hooks

The cache service provides invalidation methods that should be called when related domain entities change:

| Entity Change | Invalidation Call |
|---------------|-------------------|
| Business hours updated | `invalidateBusinessHours(restaurantId)` |
| Calendar exception created/updated/deleted | `invalidateCalendarExceptions(restaurantId, date?)` |
| Reservation policy updated | `invalidateReservationPolicy(restaurantId)` |
| Restaurant settings updated | `invalidateRestaurantSettings(restaurantId)` |

## Testing

```
npx vitest run src/modules/restaurant/tables/tests/availability-engine.spec.ts
```

Tests cover:
- Engine orchestration (short-circuit on first failure)
- Each evaluator (available / unavailable scenarios)
- Edge cases (missing date, missing time, null policies)
- Business hours day-of-week mapping
- Calendar exception type detection (holiday, closure, special hours)
- Table status mapping (all 8 states)
- Dining area / table type active checks
- Party size ranges (min, max, within, disabled policy)
