# Reservation Application Layer (Phase 12.2)

## Architecture

The application layer follows lightweight CQRS with a single `ReservationApplicationService` facade that implements all use cases as methods. Commands represent state-changing operations, queries represent read-only operations.

```
Reservation Application Layer
├── Commands            → Write operations (Create, Confirm, Cancel, CheckIn, Complete, Update)
├── Queries             → Read operations (Get, List, Search)
├── DTOs                → Data transfer objects (ReservationDTO, ReservationSummary)
├── Validator           → Application-level request validation
└── Application Service → Use case orchestration (ReservationApplicationService)
```

## Application Flow

Every use case method follows this pattern:

1. **Authorize** — validates the caller has the required permission via `AuthorizationService`
2. **Load** — fetches the aggregate from the repository (if updating/reading existing)
3. **Map** — converts command primitives to domain value objects (e.g., `PartySize.create()`)
4. **Validate** — delegates business rules to domain services (`ReservationStateMachine`, `ReservationTimeValidator`, `ReservationPolicyValidator`)
5. **Execute** — calls factory/repository to persist changes
6. **Emit** — publishes domain events via `EventBus`
7. **Audit** — records the operation via `AuditService`
8. **Cache** — invalidates relevant cache entries via optional `ReservationCacheInvalidator`
9. **Return** — maps the aggregate to a DTO and returns it

## Commands

| Command | Fields | Permission |
|---------|--------|------------|
| `CreateReservationCommand` | restaurantId, reservationNumber, date, startTime, endTime, partySize, source, customerId?, tableId?, tableGroupId?, notes?, specialRequests? | `restaurants.reservations.create` |
| `UpdateReservationCommand` | id, restaurantId, customerId?, tableId?, tableGroupId?, date?, startTime?, endTime?, partySize?, notes?, specialRequests? | `restaurants.reservations.update` |
| `ConfirmReservationCommand` | id, restaurantId | `restaurants.reservations.update` |
| `CancelReservationCommand` | id, restaurantId | `restaurants.reservations.cancel` |
| `CheckInReservationCommand` | id, restaurantId | `restaurants.reservations.update` |
| `CompleteReservationCommand` | id, restaurantId | `restaurants.reservations.update` |

## Queries

| Query | Fields | Permission |
|-------|--------|------------|
| `GetReservationQuery` | id, restaurantId | `restaurants.reservations.read` |
| `ListReservationsQuery` | restaurantId, status?, date?, customerId? | `restaurants.reservations.read` |
| `SearchReservationsQuery` | restaurantId, query?, status?, date?, customerId? | `restaurants.reservations.read` |

## DTOs

### ReservationDTO (full response)

| Field | Type | Source |
|-------|------|--------|
| id | string | aggregate.id |
| restaurantId | string | aggregate.restaurantId |
| reservationNumber | string | aggregate.reservationNumber.value |
| customerId | string \| null | aggregate.customerId |
| tableId | string \| null | aggregate.tableId |
| tableGroupId | string \| null | aggregate.tableGroupId |
| date | string (ISO) | aggregate.date.value |
| startTime | string (ISO) | aggregate.timeRange.startTime |
| endTime | string (ISO) | aggregate.timeRange.endTime |
| partySize | number | aggregate.partySize.value |
| status | string | aggregate.status.value |
| source | string | aggregate.source.value |
| notes | string \| null | aggregate.notes |
| specialRequests | string \| null | aggregate.specialRequests |
| createdBy | string | aggregate.createdBy |
| createdAt | string (ISO) | aggregate.createdAt |
| updatedAt | string (ISO) | aggregate.updatedAt |
| cancelledAt | string (ISO) \| null | aggregate.cancelledAt |

### ReservationSummary (list response)

| Field | Type |
|-------|------|
| id, restaurantId, reservationNumber, customerId | same as DTO |
| date, startTime, endTime | string (ISO) |
| partySize | number |
| status | string |
| source | string |
| createdAt | string (ISO) |

## Use Case: CreateReservation

1. Authorize `restaurants.reservations.create`
2. Map primitives → VOs: `ReservationNumber`, `ReservationDate`, `ReservationTimeRange`, `PartySize`, `ReservationSource`
3. Default status to `pending`
4. Validate time range via `ReservationTimeValidator.validateTimeRange()`
5. Validate policy via `ReservationPolicyValidator.validateForCreation()`
6. Call `factory.create()` with `CreateReservationData`
7. Repository persists via `save()`
8. Emit `ReservationCreated` event
9. Audit the creation
10. Invalidate cache
11. Return `ReservationDTO`

## Use Case: Status Transitions (Confirm, Cancel, CheckIn, Complete)

Each status transition follows the same pattern:

1. Authorize (confirm/checkIn/complete → `update`, cancel → `cancel`)
2. Load existing reservation (throws `ReservationNotFoundError` if missing)
3. Call `stateMachine.{method}(existing.status)` which validates the transition and returns new status
4. Update relevant metadata (`cancelledAt` for cancel, `updatedAt` for all)
5. Repository persists via `update()`
6. Emit the corresponding domain event (ReservationConfirmed, ReservationCancelled, ReservationCompleted)
7. Audit the state change
8. Invalidate cache
9. Return updated `ReservationDTO`

### Status Transition Map

```
pending      → confirmed, cancelled, no_show
confirmed    → checked_in, cancelled, no_show, completed (walk-in direct)
checked_in   → seated, cancelled
seated       → completed, no_show
completed    → (terminal)
cancelled    → (terminal)
no_show      → (terminal)
```

## Use Case: UpdateReservation

1. Authorize `restaurants.reservations.update`
2. Load existing reservation (throws `ReservationNotFoundError`)
3. Validate not in terminal state (throws `ReservationPolicyViolationError`)
4. Map provided fields to VOs; fall back to existing values for omitted fields
5. Validate updated time range
6. Persist via `repository.update()`
7. Emit `ReservationConfirmed` event (reservation data changed)
8. Audit the update with old/new values
9. Invalidate cache
10. Return updated `ReservationDTO`

## Use Case: GetReservation

1. Authorize `restaurants.reservations.read`
2. Load by id + restaurantId (throws `ReservationNotFoundError`)
3. Return `ReservationDTO`

## Use Case: ListReservations

1. Authorize `restaurants.reservations.read`
2. Build `ReservationListFilters` from query parameters (restaurantId, status, date, customerId)
3. Call `repository.findByFilters()`
4. Map results to `ReservationSummary[]`

## Use Case: SearchReservations

1. Authorize `restaurants.reservations.read`
2. Build `ReservationListFilters` from query parameters
3. Call `repository.findByFilters()`
4. If `query` is provided, filter results in-memory by matching against reservationNumber, customerId, notes, and specialRequests
5. Return `ReservationSummary[]`

## Error Handling

Domain errors propagate as-is (no wrapping at application layer):

| Domain Error | HTTP Status | When Thrown |
|-------------|-------------|-------------|
| `ReservationNotFoundError` | 404 | Reservation not found |
| `ReservationStateTransitionError` | 409 | Invalid status transition |
| `ReservationPolicyViolationError` | 400 | Business rule violation |
| `InvalidPartySizeError` | 400 | Party size out of range |
| `InvalidReservationDateError` | 400 | Invalid date |
| `InvalidReservationTimeError` | 400 | Invalid time |

## Testing

97 tests total (60 domain + 37 application):

- **Mapper tests (5)**: toDTO, cancelled DTO, summary, toDTOList, toSummaryList
- **Validator tests (12)**: create request validation (8), update request validation (4)
- **Application service tests (20)**: create (3), confirm (3), cancel (2), checkIn (1), complete (2), update (4), getById (2), list (2), search (1)
