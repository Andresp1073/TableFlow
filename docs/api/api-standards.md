# API Standards

**Last updated:** 2026-07-04

## URL Structure

```
/api/v1/{resource}[/{resource-id}][/{sub-resource}][/{sub-resource-id}]
```

| Component | Description | Example |
|-----------|-------------|---------|
| `/api` | API prefix | `/api` |
| `/v1` | Version | `/v1` |
| `/{resource}` | Plural noun | `/reservations` |
| `/{resource-id}` | UUID v7 | `/a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| `/{sub-resource}` | Nested resource | `/tables` |
| `/{sub-resource-id}` | UUID v7 | `/b2c3d4e5-f6a7-8901-bcde-f12345678901` |

## Naming Conventions

| Rule | Example |
|------|---------|
| **Resources are plural nouns** | `/reservations`, `/customers`, `/branches` |
| **Use kebab-case for multi-word resources** | `/audit-logs`, `/refresh-tokens`, `/business-hours` |
| **Query parameters use camelCase** | `?pageSize=20&sortBy=createdAt` |
| **Request/response fields use camelCase** | `{ "branchId": "uuid", "partySize": 4 }` |
| **Enum values use SCREAMING_SNAKE_CASE** | `PENDING`, `CONFIRMED`, `NO_SHOW` |
| **Error codes use dot notation** | `reservation.overlap`, `validation.required` |

## HTTP Methods

| Method | CRUD | Idempotent | Safe | Use Case |
|--------|------|------------|------|----------|
| `GET` | Read | ✅ | ✅ | Retrieve resources without side effects |
| `POST` | Create | ❌ | ❌ | Create new resources or execute actions |
| `PUT` | Replace | ✅ | ❌ | Full resource replacement |
| `PATCH` | Partial update | ❌ | ❌ | Partial resource modification |
| `DELETE` | Delete | ✅ | ❌ | Resource removal |

### Method Selection Rules

| Situation | Method |
|-----------|--------|
| List resources | `GET` |
| Get single resource | `GET` |
| Create resource (server-generated ID) | `POST` |
| Create resource (client-provided ID) | `PUT` with idempotency |
| Replace entire resource | `PUT` |
| Partial update (1-2 fields) | `PATCH` |
| Bulk create | `POST` to collection |
| Execute action (e.g., cancel, confirm) | `POST` with action verb |
| Soft delete | `DELETE` |
| Hard delete (admin only) | `DELETE` with `?permanent=true` |

## HTTP Headers

### Request Headers

| Header | Required | Description | Example |
|--------|----------|-------------|---------|
| `Authorization` | ✅ (auth required) | Bearer JWT token | `Bearer eyJhbGciOi...` |
| `Content-Type` | ✅ (POST/PUT/PATCH) | Request body format | `application/json` |
| `Accept` | ❌ | Response format | `application/json` |
| `Accept-Language` | ❌ | Locale for error messages | `en-US`, `es-MX` |
| `Idempotency-Key` | ❌ | Idempotency for POST/PATCH | `uuid-v4` |
| `X-Request-Id` | ❌ | Client-generated trace ID | `uuid-v4` |
| `X-CSRF-Token` | ❌ | CSRF protection (cookie-based) | `token-value` |

### Response Headers

| Header | Description | Example |
|--------|-------------|---------|
| `X-Request-Id` | Request trace ID | `a1b2c3d4-e5f6-...` |
| `X-RateLimit-Limit` | Rate limit per window | `200` |
| `X-RateLimit-Remaining` | Remaining requests | `195` |
| `X-RateLimit-Reset` | Rate limit reset timestamp (Unix) | `1704068100` |
| `Deprecation` | Deprecated endpoint timestamp | `Sun, 04 Jul 2027 00:00:00 GMT` |
| `Sunset` | End-of-life date | `Sat, 04 Jul 2028 00:00:00 GMT` |

## Status Code Usage

| Code | Usage |
|------|-------|
| `200 OK` | Successful GET, PUT, PATCH |
| `201 Created` | Successful POST (resource created) |
| `202 Accepted` | Accepted for async processing (reports, exports) |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Validation error, malformed request |
| `401 Unauthorized` | Missing or invalid authentication |
| `403 Forbidden` | Authenticated but insufficient permissions |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Business rule violation (double-booking, duplicate) |
| `410 Gone` | Resource permanently deleted (hard delete) |
| `422 Unprocessable Entity` | Business validation failure (e.g., past date) |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server error |
| `503 Service Unavailable` | Maintenance mode, overloaded |

## Cross-References

- [request-response-standards.md](./request-response-standards.md) — Unified response envelope
- [error-catalog.md](./error-catalog.md) — Error code catalog
- [versioning.md](./versioning.md) — Versioning strategy
- [rate-limit.md](./rate-limit.md) — Rate limiting details
- [idempotency.md](./idempotency.md) — Idempotency key usage
