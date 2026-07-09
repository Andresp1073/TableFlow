# Business Hours

**Last updated:** 2026-07-07

## Overview

The Business Hours module manages restaurant operating hours with support for multiple opening periods per day. It is a separate domain aggregate (one-to-one with Organization), designed for maximum flexibility and future scalability.

Each restaurant gets default business hours on first read (Mon-Fri 09:00-17:00, Sat-Sun closed) via auto-create (`getOrCreate`).

## Domain Model

```
BusinessHours (aggregate root)
 └── DaySchedule[] (value objects, 7 per restaurant)
      ├── dayOfWeek: DayOfWeek (1=Monday .. 7=Sunday)
      ├── isClosed: boolean
      └── OpeningPeriod[] (value objects)
           ├── openTime: OpeningTime (minutes from midnight, 0-1439)
           ├── closeTime: ClosingTime (minutes from midnight, 0-1439)
           └── order: integer
```

### Value Objects

| Value Object | Constraints | Description |
|-------------|-------------|-------------|
| `DayOfWeek` | Integer 1–7 | Maps to Monday–Sunday |
| `OpeningTime` | Integer 0–1439 | Minutes from midnight, parsed from "HH:MM" |
| `ClosingTime` | Integer 0–1439 | Minutes from midnight, parsed from "HH:MM" |
| `TimeRange` | open < close | Composite of OpeningTime + ClosingTime, overlap detection |
| `OpeningPeriod` | Non-negative order | Single operating window within a day |
| `DaySchedule` | Max 10 periods, no overlap, closed=no periods | Single day's schedule |

## Domain Rules

| # | Rule | Enforcement |
|---|------|-------------|
| 1 | Open time must be before close time | `TimeRange.create()` |
| 2 | No overlapping periods within the same day | `DaySchedule.create()` (O(n²) check) |
| 3 | Maximum 10 periods per day | `DaySchedule.create()` |
| 4 | Closed days cannot contain periods | `DaySchedule.create()` |
| 5 | Periods sorted by order within each day | Auto-sorted on creation |

## Default Values

| Day | Status | Hours |
|-----|--------|-------|
| Monday–Friday | Open | 09:00–17:00 |
| Saturday–Sunday | Closed | — |

## API Endpoints

| Method | URL | Permission |
|--------|-----|------------|
| `GET` | `/api/v1/restaurants/:id/business-hours` | `restaurants.business-hours.read` |
| `PUT` | `/api/v1/restaurants/:id/business-hours` | `restaurants.business-hours.update` |

### GET /api/v1/restaurants/:id/business-hours

Returns the full 7-day schedule. Uses `getOrCreate` — auto-creates with defaults on first read.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "restaurantId": "uuid",
    "schedules": [
      {
        "dayOfWeek": 1,
        "isClosed": false,
        "periods": [{ "openTime": "09:00", "closeTime": "17:00", "order": 0 }]
      },
      { "dayOfWeek": 6, "isClosed": true, "periods": [] },
      { "dayOfWeek": 7, "isClosed": true, "periods": [] }
    ],
    "createdAt": "2026-07-07T12:00:00.000Z",
    "updatedAt": "2026-07-07T12:00:00.000Z"
  }
}
```

### PUT /api/v1/restaurants/:id/business-hours

Replaces all business hours. Uses `getOrCreate` internally (upsert behavior for first write).

**Request Body:**

```json
{
  "schedules": [
    {
      "dayOfWeek": 1,
      "isClosed": false,
      "periods": [
        { "openTime": "08:00", "closeTime": "12:00", "order": 0 },
        { "openTime": "13:00", "closeTime": "18:00", "order": 1 }
      ]
    },
    { "dayOfWeek": 3, "isClosed": true, "periods": [] }
  ]
}
```

**Validation:**
- `dayOfWeek`: Integer 1–7
- `isClosed`: Boolean (if true, `periods` must be empty)
- `openTime`, `closeTime`: String in `HH:MM` format (00:00–23:59)
- `order`: Non-negative integer (display order within day)
- Periods within a day must not overlap
- Max 7 day schedules, max 10 periods per day
- Closed days cannot have periods

**Response:** `200 OK`

## Permission Model

| Action | Permission Code |
|--------|----------------|
| Read | `restaurants.business-hours.read` |
| Update | `restaurants.business-hours.update` |

Assigned to: `super-admin`, `restaurant-owner` (via seed).

## Future Scalability

The module is designed for the following future features:

### Branches
- Business hours can become branch-scoped by adding `branchId` (nullable FK to Branch)
- OpeningPeriod already supports branch-level queries via the `businessHoursId` index

### Holiday Overrides
- A new `HolidayHours` aggregate can reference the same restaurant/branch with a specific `date`
- Holiday hours override regular business hours for that date
- Independent from the core BusinessHours aggregate

### Seasonal Schedules
- A `SeasonalSchedule` aggregate can define date ranges with overriding hours
- Would follow the same pattern as HolidayHours but with `startDate`/`endDate`

### Time Zone Awareness
- Business hours are stored as local time (minutes from midnight)
- A `timezone` field on the restaurant or branch is used at the application layer to convert to UTC when needed for scheduling

### Special Opening Hours
- The `OpeningPeriod` model already supports multiple periods per day
- The `order` field allows custom display and priority ordering

## Validation Strategy

Validation is applied at three levels:

1. **Request-level (Zod)** — Shape, types, time format (`HH:MM` regex), and range validation on incoming HTTP requests
2. **Domain-level (Value Objects)** — Business rule enforcement via value object constructors
3. **Aggregate-level (DaySchedule)** — Cross-period validation (overlap detection, closed-day constraints)

## Module Structure

```
src/modules/restaurant/business-hours/
├── domain/
│   ├── models/
│   │   ├── BusinessHours.ts          (aggregate interface)
│   │   ├── DayOfWeek.ts
│   │   ├── OpeningTime.ts
│   │   ├── ClosingTime.ts
│   │   ├── TimeRange.ts
│   │   ├── OpeningPeriod.ts
│   │   └── DaySchedule.ts
│   ├── events/
│   │   ├── BusinessHoursCreated.ts
│   │   └── BusinessHoursUpdated.ts
│   └── repositories/
│       ├── BusinessHoursRepository.ts
│       └── BusinessHoursFactory.ts
├── errors/
│   └── BusinessHoursNotFoundError.ts
├── application/
│   ├── services/BusinessHoursApplicationService.ts
│   ├── commands/CreateBusinessHoursCommand.ts
│   ├── commands/UpdateBusinessHoursCommand.ts
│   ├── queries/GetBusinessHoursQuery.ts
│   ├── dtos/BusinessHoursDTO.ts
│   ├── mappers/BusinessHoursMapper.ts
│   └── validators/BusinessHoursValidator.ts
├── infrastructure/
│   └── repositories/
│       ├── PrismaBusinessHoursRepository.ts
│       └── ConcreteBusinessHoursFactory.ts
├── presentation/
│   ├── controllers/BusinessHoursController.ts
│   ├── routes/business-hours.routes.ts
│   └── validation/business-hours.validation.ts
└── tests/
    ├── value-objects.spec.ts
    ├── application-service.spec.ts
    └── api.spec.ts
```

## Related Documentation

- [Restaurant API](./api.md)
- [Endpoint Catalog](../api/endpoint-catalog.md)
- [Error Catalog](../api/error-catalog.md)
