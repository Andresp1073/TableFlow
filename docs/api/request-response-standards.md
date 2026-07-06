# Request & Response Standards

**Last updated:** 2026-07-04

## Unified Response Envelope

All API responses use a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... },
  "error": null
}
```

| Field | Type | Always | Description |
|-------|------|--------|-------------|
| `success` | boolean | ✅ | `true` for 2xx, `false` for 4xx/5xx |
| `data` | object/array/null | ✅ | Response payload |
| `meta` | object/null | ✅ | Pagination, request ID, timestamps |
| `error` | object/null | ✅ | Error details (null on success) |
| `message` | string | ❌ | Human-readable status message (optional; may be included in 2xx responses for user display) |

## Success Responses

### Single Resource

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "createdAt": "2026-07-04T10:00:00.000Z",
    "updatedAt": "2026-07-04T10:00:00.000Z"
  },
  "meta": {
    "requestId": "req-uuid-v4"
  },
  "error": null
}
```

### List (Paginated)

```json
{
  "success": true,
  "data": [
    { "id": "...", "firstName": "John", ... },
    { "id": "...", "firstName": "Jane", ... }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 143,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "requestId": "req-uuid-v4"
  },
  "error": null
}
```

### Created (201)

```json
{
  "success": true,
  "data": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    ...
  },
  "meta": {
    "requestId": "req-uuid-v4",
    "location": "/api/v1/reservations/b2c3d4e5-f6a7-8901-bcde-f12345678901"
  },
  "error": null
}
```

Response includes `Location` header pointing to the new resource URL.

### Updated (200)

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req-uuid-v4"
  },
  "error": null
}
```

### Deleted (204)

No body. Response headers only.

## Error Response

### Validation Error (400)

```json
{
  "success": false,
  "data": null,
  "meta": {
    "requestId": "req-uuid-v4"
  },
  "error": {
    "code": "validation.failed",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "code": "validation.email.invalid",
        "message": "Must be a valid email address",
        "value": "not-an-email"
      },
      {
        "field": "partySize",
        "code": "validation.min",
        "message": "Must be at least 1",
        "value": 0
      }
    ]
  }
}
```

### Unauthorized (401)

```json
{
  "success": false,
  "data": null,
  "meta": {
    "requestId": "req-uuid-v4"
  },
  "error": {
    "code": "auth.token.expired",
    "message": "Access token has expired",
    "details": null
  }
}
```

### Forbidden (403)

```json
{
  "success": false,
  "data": null,
  "meta": {
    "requestId": "req-uuid-v4"
  },
  "error": {
    "code": "auth.forbidden",
    "message": "Insufficient permissions to perform this action",
    "details": {
      "requiredPermission": "reservations.create",
      "resourceId": "branch-uuid"
    }
  }
}
```

### Not Found (404)

```json
{
  "success": false,
  "data": null,
  "meta": {
    "requestId": "req-uuid-v4"
  },
  "error": {
    "code": "resource.not_found",
    "message": "Reservation with id 'invalid-uuid' not found",
    "details": null
  }
}
```

### Conflict (409)

```json
{
  "success": false,
  "data": null,
  "meta": {
    "requestId": "req-uuid-v4"
  },
  "error": {
    "code": "reservation.overlap",
    "message": "The requested table is already booked for the specified time slot",
    "details": {
      "conflictingReservationId": "existing-uuid",
      "tableId": "table-uuid",
      "date": "2026-07-15",
      "time": "19:00"
    }
  }
}
```

### Rate Limit (429)

```json
{
  "success": false,
  "data": null,
  "meta": {
    "requestId": "req-uuid-v4"
  },
  "error": {
    "code": "rate_limit.exceeded",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 45
    }
  }
}
```

### Internal Error (500)

```json
{
  "success": false,
  "data": null,
  "meta": {
    "requestId": "req-uuid-v4"
  },
  "error": {
    "code": "internal.error",
    "message": "An unexpected error occurred",
    "details": {
      "traceId": "internal-trace-uuid"
    }
  }
}
```

Never expose stack traces in production responses.

## Request Body Standards

| Rule | Description |
|------|-------------|
| JSON only | All request bodies use `application/json` |
| camelCase | All field names use camelCase |
| UUID format | IDs are UUID v7 strings `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| ISO 8601 | Dates: `"2026-07-04"`; DateTimes: `"2026-07-04T10:00:00.000Z"` |
| Time format | `"19:00:00"` (HH:mm:ss) |
| Empty strings | Not allowed for required fields — omit or use null |
| Extra fields | Ignored (not rejected) for forward compatibility |

## Response Body Standards

| Rule | Description |
|------|-------------|
| Always envelope | Every response uses the unified envelope |
| Null vs undefined | `null` explicitly returned; never omit fields |
| Timestamps | Always ISO 8601 with UTC timezone (`Z` suffix) |
| Decimal numbers | ISO string for monetary values (`"25.99"`) |
| Large integers | String for IDs beyond JS safe integer range (not applicable with UUIDs) |
| Paginated lists | Always include `meta` with pagination info |

## Cross-References

- [error-catalog.md](./error-catalog.md) — Complete error code catalog
- [pagination.md](./pagination.md) — Pagination meta fields
- [api-standards.md](./api-standards.md) — HTTP headers and status codes
- [validation.md](./validation.md) — Validation rules
