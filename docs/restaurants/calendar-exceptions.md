# Calendar Exceptions

**Last updated:** 2026-07-08

## Overview

The Calendar Exceptions module provides a flexible system for overriding standard Business Hours on specific dates. It supports multiple exception types (holidays, special openings, closures, events) and is designed for future integration with a Reservation Policy resolver.

Each exception is scoped to a restaurant (Organization) and is uniquely identified by `(restaurantId, date, type)` — meaning you can have at most one exception of each type per date.

## Architecture

```
CalendarException (aggregate root)
 ├── id: string (UUID)
 ├── restaurantId: string
 ├── title: string
 ├── description: string?
 ├── type: ExceptionType (value object)
 ├── date: ExceptionDate (value object)
 ├── isClosed: boolean
 ├── openTime: string? (HH:MM)
 ├── closeTime: string? (HH:MM)
 ├── allDay: boolean
 └── priority: Priority (value object, 0-100)
```

### Value Objects

| Value Object | Constraints | Description |
|-------------|-------------|-------------|
| `ExceptionDate` | YYYY-MM-DD, no past dates (configurable) | The date this exception applies to |
| `ExceptionType` | One of 7 predefined types | Categorizes the exception |
| `OpeningPeriod` | Open < close, HH:MM format | Validates opening time window |
| `Priority` | Integer 0–100, default 50 | Resolution priority (higher = wins) |

### Supported Types

| Type | Description | Closure Type |
|------|-------------|--------------|
| `holiday` | Public or religious holiday | No |
| `special_opening` | Extended or reduced hours for special events | No |
| `temporary_closure` | Full-day closure (e.g., renovation) | Yes |
| `maintenance` | Scheduled maintenance closure | Yes |
| `private_event` | Private event booking | No |
| `seasonal_hours` | Seasonal schedule change | No |
| `emergency_closure` | Unexpected closure (e.g., weather, power outage) | Yes |

## Domain Rules

| # | Rule | Enforcement |
|---|------|-------------|
| 1 | Past dates are rejected by default | `ExceptionDate.create()` |
| 2 | Open time must be before close time | `OpeningPeriod.create()` |
| 3 | Closed exception cannot contain opening hours | `CalendarExceptionRules.validateClosedExceptionNoHours()` |
| 4 | Non-closed exception requires opening hours | `CalendarExceptionRules.validateTimesForNonClosed()` |
| 5 | No duplicate exception on same date/type | `CalendarExceptionRules.validateExceptionNotDuplicate()` |

## Priority Rules

Priority determines which exception wins when multiple exceptions exist for the same date:

| Priority Range | Meaning |
|---------------|---------|
| 0–30 | Low — system defaults, seasonal patterns |
| 31–70 | Medium — standard exceptions (default: 50) |
| 71–100 | High — emergency closures, critical overrides |

When the resolver is implemented, the exception with the highest priority will override Business Hours for that date. For equal priorities, the type hierarchy will determine precedence.

## Override Strategy

```
Business Hours
     ↓
Calendar Exceptions (highest priority wins)
     ↓
Reservation Policy (future)
     ↓
Reservation Engine (future)
```

Each layer overrides the previous one. Calendar Exceptions operate at the date level — they override the entire day's business hours.

### Override Examples

**Holiday Closure:**
```json
{
  "title": "Christmas Day",
  "type": "holiday",
  "date": "2026-12-25",
  "isClosed": true,
  "allDay": true,
  "priority": 60
}
```

**Special Opening (reduced hours):**
```json
{
  "title": "New Year's Eve",
  "type": "special_opening",
  "date": "2026-12-31",
  "isClosed": false,
  "openTime": "10:00",
  "closeTime": "16:00",
  "allDay": false,
  "priority": 50
}
```

**Emergency Closure:**
```json
{
  "title": "Power Outage",
  "type": "emergency_closure",
  "date": "2026-08-15",
  "isClosed": true,
  "allDay": true,
  "priority": 100
}
```

## API Endpoints

| Method | URL | Permission |
|--------|-----|------------|
| `GET` | `/api/v1/restaurants/:restaurantId/calendar-exceptions` | `restaurants.calendar-exceptions.read` |
| `POST` | `/api/v1/restaurants/:restaurantId/calendar-exceptions` | `restaurants.calendar-exceptions.create` |
| `PUT` | `/api/v1/restaurants/:restaurantId/calendar-exceptions/:id` | `restaurants.calendar-exceptions.update` |
| `DELETE` | `/api/v1/restaurants/:restaurantId/calendar-exceptions/:id` | `restaurants.calendar-exceptions.delete` |

### GET /api/v1/restaurants/:restaurantId/calendar-exceptions

Returns all calendar exceptions for a restaurant. Supports optional date range filtering.

**Query Parameters:**
- `startDate` (optional): Filter from this date (YYYY-MM-DD)
- `endDate` (optional): Filter to this date (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "restaurantId": "uuid",
      "title": "Christmas Day",
      "description": null,
      "type": "holiday",
      "date": "2026-12-25",
      "isClosed": true,
      "openTime": null,
      "closeTime": null,
      "allDay": true,
      "priority": 60,
      "createdAt": "2026-07-08T12:00:00.000Z",
      "updatedAt": "2026-07-08T12:00:00.000Z"
    }
  ]
}
```

### POST /api/v1/restaurants/:restaurantId/calendar-exceptions

Creates a new calendar exception.

**Request Body:**
```json
{
  "title": "Christmas Day",
  "type": "holiday",
  "date": "2026-12-25",
  "isClosed": true,
  "allDay": true,
  "priority": 60
}
```

**Validation:**
- `title`: Required, 1–255 characters
- `type`: One of the 7 supported types
- `date`: Required, YYYY-MM-DD, must not be in the past
- `isClosed`: Required boolean
- `openTime`/`closeTime`: HH:MM format, required when `isClosed` is false, forbidden when `isClosed` is true
- `allDay`: Required boolean
- `priority`: Optional integer 0–100 (default: 50)

**Response:** `201 Created`

### PUT /api/v1/restaurants/:restaurantId/calendar-exceptions/:id

Updates an existing calendar exception. Same validation rules as create.

**Response:** `200 OK`

### DELETE /api/v1/restaurants/:restaurantId/calendar-exceptions/:id

Deletes a calendar exception.

**Response:** `204 No Content`

## Permission Model

| Action | Permission Code |
|--------|----------------|
| Read | `restaurants.calendar-exceptions.read` |
| Create | `restaurants.calendar-exceptions.create` |
| Update | `restaurants.calendar-exceptions.update` |
| Delete | `restaurants.calendar-exceptions.delete` |

Assigned to: `super-admin`, `restaurant-owner` (via seed).

## Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| 404 | `calendar_exception.not_found` | Exception not found |
| 409 | `calendar_exception.duplicate` | Exception with same date/type already exists |

## Module Structure

```
src/modules/restaurant/calendar-exceptions/
├── domain/
│   ├── models/
│   │   ├── CalendarException.ts       (aggregate interface)
│   │   ├── ExceptionDate.ts
│   │   ├── ExceptionType.ts
│   │   ├── OpeningPeriod.ts
│   │   └── Priority.ts
│   ├── events/
│   │   ├── CalendarExceptionCreated.ts
│   │   ├── CalendarExceptionUpdated.ts
│   │   └── CalendarExceptionDeleted.ts
│   ├── rules/
│   │   └── CalendarExceptionRules.ts
│   └── repositories/
│       ├── CalendarExceptionRepository.ts
│       └── CalendarExceptionFactory.ts
├── errors/
│   ├── CalendarExceptionNotFoundError.ts
│   └── CalendarExceptionDuplicateError.ts
├── application/
│   ├── services/CalendarExceptionApplicationService.ts
│   ├── commands/CreateCalendarExceptionCommand.ts
│   ├── commands/UpdateCalendarExceptionCommand.ts
│   ├── commands/DeleteCalendarExceptionCommand.ts
│   ├── queries/GetCalendarExceptionsQuery.ts
│   ├── dtos/CalendarExceptionDTO.ts
│   ├── mappers/CalendarExceptionMapper.ts
│   └── validators/CalendarExceptionValidator.ts
├── infrastructure/
│   └── repositories/
│       ├── PrismaCalendarExceptionRepository.ts
│       └── ConcreteCalendarExceptionFactory.ts
├── presentation/
│   ├── controllers/CalendarExceptionController.ts
│   ├── routes/calendar-exceptions.routes.ts
│   └── validation/calendar-exceptions.validation.ts
└── tests/
    ├── value-objects.spec.ts
    ├── application-service.spec.ts
    └── api.spec.ts
```

## Related Documentation

- [Business Hours](./business-hours.md)
- [Restaurant API](./api.md)
- [Endpoint Catalog](../api/endpoint-catalog.md)
- [Error Catalog](../api/error-catalog.md)
