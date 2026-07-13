# Reservation Domain (Phase 12.1)

## Overview
The Reservation domain models the core booking entity in TableFlow. A `Reservation` is an aggregate root that tracks the lifecycle of a guest's booking from creation through seating, completion, or cancellation. It integrates with the Availability Engine for table assignment and the Audit module for change tracking.

## Value Objects

| VO | Fields | Validation |
|----|--------|------------|
| `ReservationNumber` | `value: string` | 1–20 chars, uppercase alphanumeric + hyphens/underscores |
| `PartySize` | `value: number` | Integer, 1–100 |
| `ReservationDate` | `value: Date` | Valid Date instance |
| `ReservationTimeRange` | `startTime: Date, endTime: Date` | End after start, valid dates |
| `ReservationStatus` | `value: "pending" \| "confirmed" \| "checked_in" \| "seated" \| "completed" \| "cancelled" \| "no_show"` | FSM transition matrix |
| `ReservationSource` | `value: "website" \| "phone" \| "walk_in" \| "mobile_app" \| "admin_panel" \| "api"` | One of 6 predefined sources |

## Aggregate: `Reservation`

```
Reservation {
  id: string
  restaurantId: string
  reservationNumber: ReservationNumber
  customerId: string | null
  tableId: string | null
  tableGroupId: string | null
  date: ReservationDate
  timeRange: ReservationTimeRange
  partySize: PartySize
  status: ReservationStatus
  source: ReservationSource
  notes: string | null
  specialRequests: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  cancelledAt: Date | null
}
```

Key design decisions:
- `customerId` is nullable for walk-in reservations
- `tableId` and `tableGroupId` are nullable until assigned by the availability/reservation engine
- `reservationNumber` is a human-readable identifier distinct from the system UUID
- Status is managed by a state machine — see lifecycle below

## Reservation Lifecycle (State Machine)

```
                  ┌──────────┐
                  │ Pending  │
                  └────┬─────┘
              ┌────────┼──────────┐
              ▼        ▼          ▼
         ┌────────┐ ┌────────┐ ┌────────┐
         │Confirmed│ │Cancelled│ │No Show │
         └───┬─────┘ └────────┘ └────────┘
        ┌────┼────┐
        ▼    ▼    ▼
   ┌────────┐     ┌───────────┐
   │Checked │     │Completed  │
   │  In    │     └───────────┘
   └───┬────┘
       ▼
  ┌────────┐     ┌────────┐
  │ Seated │────→│Completed│
  └────────┘     └────────┘
       │
       ▼
  ┌────────┐
  │No Show │
  └────────┘
```

Terminal states: `completed`, `cancelled`, `no_show`

Active states: `pending`, `confirmed`, `checked_in`, `seated`

### Key transition rules
- A reservation **cannot** check in without being confirmed first
- A **cancelled** reservation cannot be completed
- **Completed** and **no_show** are terminal — no further transitions
- **Confirmed** reservations may be completed directly (e.g., walk-in that never needed seating)

## Domain Services

### `ReservationStateMachine`
- `transition(current, target)` — validates and executes status transition
- `confirm(current)`, `checkIn(current)`, `seat(current)`, `complete(current)`, `cancel(current)`, `markNoShow(current)` — convenience methods
- `canTransition(current, target)` — query without mutation
- `getAllowedTargets(current)` — list valid next states
- `isActive(current)` / `isTerminal(current)` — state queries

### `ReservationPolicyValidator`
- `validateForCreation(partySize, timeRange, source)` — validates business policies before creation
- `validatePartySize(partySize)` — party size minimum
- `validateTimeRange(timeRange)` — temporal consistency
- `validateSource(source)` — source validation (extension point)

### `ReservationTimeValidator`
- `validateForCreation(date, timeRange)` — validates temporal integrity
- `validateDate(date)` — checks date validity
- `validateTimeRange(timeRange)` — checks time range
- `validateNotInPast(date)` — prevents backdated reservations
- `validateDuration(timeRange, maxDurationMinutes)` — duration limits

## Domain Errors (typed)

| Error | Code | When thrown |
|-------|------|-------------|
| `InvalidPartySizeError` | `reservation.invalid_party_size` | Non-positive or excessive party size |
| `InvalidReservationTimeError` | `reservation.invalid_time` | Invalid or inconsistent time range |
| `InvalidReservationDateError` | `reservation.invalid_date` | Invalid date |
| `ReservationStateTransitionError` | `reservation.invalid_transition` | Illegal status transition |
| `ReservationNotFoundError` | `reservation.not_found` | Reservation not found |
| `ReservationPolicyViolationError` | `reservation.policy_violation` | General policy violation |

## Domain Events (prepared, not published)
- `ReservationCreated` — id, restaurantId, reservationNumber, partySize, createdBy
- `ReservationConfirmed` — id, restaurantId, reservationNumber
- `ReservationCancelled` — id, restaurantId, reservationNumber, cancelledBy
- `ReservationCompleted` — id, restaurantId, reservationNumber
- `ReservationNoShow` — id, restaurantId, reservationNumber

## Future Integrations

### Availability Engine
The Reservation domain is designed to integrate with the existing Availability Engine:
- `tableId` is assigned after availability check via `TableAvailabilityService`
- `tableGroupId` supports group seating (tables merged via Table Groups module)
- Time range overlaps are validated at the application layer before assignment

### Notifications
Events (ReservationCreated, ReservationConfirmed, ReservationCancelled) serve as integration points for:
- Email confirmation to customer
- SMS reminders
- Staff notifications

### Payments
The `ReservationStatus` FSM supports extension with a `deposit_required` or `deposit_paid` state when payment integration is added.
