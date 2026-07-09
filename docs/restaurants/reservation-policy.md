# Reservation Policy

**Last updated:** 2026-07-07

## Overview

The Reservation Policy is a separate domain aggregate that defines the rules and constraints for making reservations at a restaurant. It is independent from the Restaurant and RestaurantSettings aggregates, with a one-to-one relationship to the restaurant (Organization).

Each restaurant gets a default policy on first read (auto-created via `getOrCreate`). The policy is loaded and managed independently, even though it shares the same Organization FK.

## Business Rules

| # | Rule | Implementation |
|---|------|----------------|
| 1 | Party size must be between `minPartySize` and `maxPartySize` (inclusive) | `PartySize` value object (range 1–100) |
| 2 | Reservation duration must be within configured limits | `ReservationDuration` value object (15–480 min) |
| 3 | Advance booking must respect both min and max windows | `AdvanceBookingWindow` value object (minMinutes: 0–43200, maxDays: 0–365) |
| 4 | Cancellation must be requested before the deadline | `CancellationDeadline` value object (0–43200 min) |
| 5 | Modification deadline is same domain as cancellation deadline | Reuses `CancellationDeadline` value object |
| 6 | Walk-ins may be allowed or disallowed | Boolean `allowWalkIns` |
| 7 | Auto-confirm may be enabled or disabled | Boolean `autoConfirmReservations` |
| 8 | Customer phone and email requirements are independently configurable | `requireCustomerPhone`, `requireCustomerEmail` |
| 9 | Customer is limited to a maximum number of active reservations | `maxActiveReservationsPerCustomer` (1–100) |
| 10 | A grace period defines the late-arrival window | `GracePeriod` value object (0–120 min) |

## Default Values

| Field | Default |
|-------|---------|
| `enabled` | `true` |
| `minPartySize` | `1` |
| `maxPartySize` | `20` |
| `defaultReservationDuration` | `60` (minutes) |
| `minAdvanceBookingMinutes` | `60` |
| `maxAdvanceBookingDays` | `30` |
| `cancellationDeadlineMinutes` | `1440` (24h) |
| `modificationDeadlineMinutes` | `1440` (24h) |
| `allowWalkIns` | `true` |
| `autoConfirmReservations` | `false` |
| `requireCustomerPhone` | `false` |
| `requireCustomerEmail` | `true` |
| `maxActiveReservationsPerCustomer` | `10` |
| `gracePeriodMinutes` | `15` |

## Value Object Constraints

All value objects perform validation on `create()` and skip validation on `reconstitute()` (for rehydrating from persistence):

| Value Object | Constraints |
|-------------|-------------|
| `PartySize` | Integer, 1–100 |
| `ReservationDuration` | Integer, 15–480 minutes |
| `AdvanceBookingWindow` | `minMinutes`: integer 0–43200, `maxDays`: integer 0–365 |
| `CancellationDeadline` | Integer, 0–43200 minutes |
| `GracePeriod` | Integer, 0–120 minutes |

## Permission Model

| Action | Permission Code |
|--------|----------------|
| Read | `restaurants.reservation-policy.read` |
| Update | `restaurants.reservation-policy.update` |

Assigned to: `super-admin`, `restaurant-owner` (via seed).

## API Endpoints

See [API Endpoint Catalog](../api/endpoint-catalog.md#17-reservation-policy).

| Method | URL | Permission |
|--------|-----|------------|
| `GET` | `/api/v1/restaurants/:id/reservation-policy` | `restaurants.reservation-policy.read` |
| `PUT` | `/api/v1/restaurants/:id/reservation-policy` | `restaurants.reservation-policy.update` |

The `GET` endpoint uses `getOrCreate` — returns existing policy if found, otherwise creates a new one with default values and returns it.

The `PUT` endpoint performs partial update (only provided fields are changed). It also uses `getOrCreate` internally so the first write to a new restaurant creates the policy before updating it.

## Validation Strategy

Validation is applied at two levels:

1. **Request-level (Zod)** — Shape, types, and range validation on incoming HTTP requests (presentation layer).
2. **Domain-level (Value Objects)** — Business rule enforcement via value object constructors (domain layer).

Domain validators (`CreateReservationPolicyValidator`, `UpdateReservationPolicyValidator`) are defined in the application layer but are minimal — the heavy lifting is done by Zod schemas for request validation and value objects for domain invariants.

## Domain Events

| Event | Trigger |
|-------|---------|
| `ReservationPolicyCreated` | Policy first persisted |
| `ReservationPolicyUpdated` | Policy modified |

Events include the policy ID, restaurant ID, and a timestamp.

## Future Integration with Reservations

The ReservationPolicy aggregate is designed to be consumed by the future Reservations module:

- **Availability check**: Before creating a reservation, the reservations module will load the policy to validate party size, duration, advance booking window, etc.
- **Cancellation**: The `cancellationDeadlineMinutes` will be checked against the reservation's start time to determine if free cancellation is still allowed.
- **Modification**: The `modificationDeadlineMinutes` will be checked similarly for modification requests.
- **Auto-confirm**: If `autoConfirmReservations` is enabled, new reservations may skip manual confirmation.
- **Customer limits**: `maxActiveReservationsPerCustomer` will be enforced when creating new reservations.
- **Walk-ins**: If `allowWalkIns` is false, walk-in reservation creation may be restricted.

## Module Structure

```
src/modules/restaurant/reservation-policy/
├── domain/
│   ├── models/
│   │   ├── ReservationPolicy.ts
│   │   ├── PartySize.ts
│   │   ├── ReservationDuration.ts
│   │   ├── AdvanceBookingWindow.ts
│   │   ├── CancellationDeadline.ts
│   │   └── GracePeriod.ts
│   ├── repositories/
│   │   └── ReservationPolicyRepository.ts
│   ├── factories/
│   │   └── ReservationPolicyFactory.ts
│   └── events/
│       ├── ReservationPolicyCreated.ts
│       └── ReservationPolicyUpdated.ts
├── errors/
│   └── ReservationPolicyNotFoundError.ts
├── application/
│   ├── services/ReservationPolicyApplicationService.ts
│   ├── commands/
│   │   ├── CreateReservationPolicyCommand.ts
│   │   └── UpdateReservationPolicyCommand.ts
│   ├── queries/GetReservationPolicyQuery.ts
│   ├── dtos/ReservationPolicyDTO.ts
│   ├── mappers/ReservationPolicyMapper.ts
│   └── validators/
│       ├── CreateReservationPolicyValidator.ts
│       └── UpdateReservationPolicyValidator.ts
├── infrastructure/
│   └── repositories/
│       ├── PrismaReservationPolicyRepository.ts
│       └── ConcreteReservationPolicyFactory.ts
├── presentation/
│   ├── controllers/ReservationPolicyController.ts
│   ├── routes/reservation-policy.routes.ts
│   └── validation/reservation-policy.validation.ts
└── tests/
    ├── value-objects.spec.ts
    ├── application-service.spec.ts
    └── api.spec.ts
```

## Related Documentation

- [Restaurant API](./api.md)
- [Application Layer](../backend/docs/restaurants/application-layer.md)
- [Error Catalog](../api/error-catalog.md)
