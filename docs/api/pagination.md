# Pagination

**Last updated:** 2026-07-04

## Strategy: Offset-Based Pagination

TableFlow uses **offset-based pagination** (page + pageSize) for all list endpoints. This provides predictable, stable pagination suitable for admin dashboards and reporting.

For high-volume, real-time endpoints (notifications, audit logs), **cursor-based pagination** is available as an alternative.

## Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | - | Page number (1-indexed) |
| `pageSize` | integer | 20 | 100 | Items per page |

### Request Example

```
GET /api/v1/reservations?page=2&pageSize=50
```

## Response Meta

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 2,
    "pageSize": 50,
    "totalCount": 143,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": true,
    "requestId": "req-uuid-v4"
  }
}
```

| Meta Field | Type | Description |
|------------|------|-------------|
| `page` | integer | Current page number |
| `pageSize` | integer | Items per page |
| `totalCount` | integer | Total items matching the query (across all pages) |
| `totalPages` | integer | `Math.ceil(totalCount / pageSize)` |
| `hasNextPage` | boolean | `page < totalPages` |
| `hasPreviousPage` | boolean | `page > 1` |

## Pagination Behavior

| Scenario | Behavior |
|----------|----------|
| `page` exceeds `totalPages` | Return empty `data` array, not 404 |
| `pageSize` exceeds max (100) | Silently cap to 100 |
| `pageSize` <= 0 | Default to 20 |
| `page` <= 0 | Default to 1 |
| `totalCount` = 0 | `totalPages` = 0, `hasNextPage` = false |

## Cursor-Based Pagination (Alternative)

For real-time endpoints, use cursor-based pagination with the `cursor` and `limit` parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `cursor` | string (UUID) | ID of the last item from previous page |
| `limit` | integer | Max items to return (default 20, max 100) |

### Cursor Response Meta

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "limit": 20,
    "hasMore": true,
    "nextCursor": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "requestId": "req-uuid-v4"
  }
}
```

### Endpoints Using Cursor Pagination

| Endpoint | Rationale |
|----------|-----------|
| `GET /api/v1/notifications` | High write volume, real-time feed |
| `GET /api/v1/audit-logs` | High write volume, append-only |
| `GET /api/v1/reservations/status-history` | Append-only, chronological |

## Default Sort Order

When using pagination, results are always sorted by a deterministic field to prevent items from shifting between pages:

| Resource | Default Sort |
|----------|-------------|
| reservations | `date ASC, time ASC` |
| customers | `lastName ASC, firstName ASC` |
| notifications | `createdAt DESC` |
| audit_logs | `createdAt DESC` |
| users | `createdAt DESC` |
| All others | `createdAt DESC` |

## Cross-References

- [request-response-standards.md](./request-response-standards.md) — Response envelope
- [filtering.md](./filtering.md) — Combining pagination with filters
- [sorting.md](./sorting.md) — Sort parameter specification
