# Validation

**Last updated:** 2026-07-04

## Validation Layers

| Layer | Scope | Technology | Timing |
|-------|-------|------------|--------|
| **Transport** | HTTP headers, method, content-type | Express middleware | Before request handling |
| **Schema** | Request body structure, field types, formats | Zod schemas | After request parsing |
| **Business** | Domain rules, state transitions, references | Service layer | During business logic |
| **Database** | Unique constraints, FKs, triggers | MySQL / Prisma | At persistence |

## Field Validation Rules

### Common Rules

| Rule | Code | Description |
|------|------|-------------|
| Required | `validation.required` | Field must be present and non-null |
| Type | `validation.type` | Field must be expected type (string, number, boolean) |
| Format | `validation.format` | Field must match expected format (email, UUID, date, time) |
| Min length | `validation.min_length` | String must be at least N characters |
| Max length | `validation.max_length` | String must be at most N characters |
| Min value | `validation.min` | Number must be >= N |
| Max value | `validation.max` | Number must be <= N |
| Enum | `validation.enum` | Value must be one of allowed set |
| Pattern | `validation.pattern` | Value must match regex pattern |
| Empty | `validation.empty` | String must not be empty |

### Type-Specific Formats

| Format | Pattern | Example |
|--------|---------|---------|
| UUID v7 | `/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i` | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| Email | RFC 5322 simplified | `user@example.com` |
| Date | `YYYY-MM-DD` | `2026-07-15` |
| DateTime | ISO 8601 | `2026-07-15T19:00:00.000Z` |
| Time | `HH:mm:ss` | `19:00:00` |
| Phone | E.164 | `+14155551234` |
| URL | HTTP/HTTPS | `https://example.com/logo.png` |

## Business Validation Rules

### Reservations

| Rule | Code | Description |
|------|------|-------------|
| Party size range | `validation.party_size` | Must be 1–20 |
| Date not in past | `validation.past_date` | Reservation date must be today or in future |
| Within booking window | `validation.booking_window` | Date must be within `max_advance_booking_days` |
| During business hours | `validation.business_hours` | Time must be within branch operating hours |
| Valid status transition | `validation.status_transition` | Status must follow defined state machine |
| Table capacity match | `validation.table_capacity` | Party size must be between `min_capacity` and `max_capacity` |
| No overlapping bookings | `validation.table_overlap` | Table must not be double-booked |

### Customers

| Rule | Code | Description |
|------|------|-------------|
| Unique email | `validation.duplicate_email` | Email must not already exist in system |
| Unique phone | `validation.duplicate_phone` | Phone must not already exist in system |

### Users

| Rule | Code | Description |
|------|------|-------------|
| Password complexity | `validation.password_complexity` | Min 12 chars, uppercase, lowercase, digit, special |
| Unique email | `validation.duplicate_email` | Email must not already exist in system |
| Valid role assignment | `validation.role_scope` | Role must be assignable within user's org scope |

## Validation Response Format

See [request-response-standards.md](./request-response-standards.md) for the full validation error response structure.

```json
{
  "success": false,
  "data": null,
  "meta": { "requestId": "req-uuid-v4" },
  "error": {
    "code": "validation.failed",
    "message": "Request validation failed",
    "details": [
      {
        "field": "partySize",
        "code": "validation.min",
        "message": "Must be at least 1",
        "value": 0
      },
      {
        "field": "email",
        "code": "validation.email.invalid",
        "message": "Must be a valid email address",
        "value": "not-an-email"
      }
    ]
  }
}
```

| Error Detail Field | Type | Description |
|--------------------|------|-------------|
| `field` | string | Dot-notation path to the field (e.g., `address.city`) |
| `code` | string | Machine-readable error code |
| `message` | string | Human-readable error message |
| `value` | any | The rejected value (omit for security on passwords) |

## Cross-References

- [request-response-standards.md](./request-response-standards.md) — Error response structure
- [error-catalog.md](./error-catalog.md) — Complete error code catalog
- [endpoint-catalog.md](./endpoint-catalog.md) — Per-endpoint validation rules
