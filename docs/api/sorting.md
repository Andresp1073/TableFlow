# Sorting

**Last updated:** 2026-07-04

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sortBy` | string | `createdAt` | Field to sort by |
| `sortDirection` | string | `DESC` | `ASC` or `DESC` |

### Request Examples

```
# Single field sort
GET /api/v1/reservations?sortBy=date&sortDirection=ASC

# Explicit direction
GET /api/v1/customers?sortBy=lastName&sortDirection=ASC
```

## Multi-Field Sorting

Multi-field sorting uses a comma-separated list in `sortBy` with paired `sortDirection`:

| Parameter | Value | Meaning |
|-----------|-------|---------|
| `sortBy` | `date,time` | Sort by date first, then by time |
| `sortDirection` | `ASC,ASC` | Both ascending |

```
GET /api/v1/reservations?sortBy=date,time&sortDirection=ASC,ASC
```

When `sortDirection` has fewer values than `sortBy`, the last value is applied to remaining fields.

## Sortable Fields

Each endpoint in the [endpoint-catalog.md](./endpoint-catalog.md) documents which fields support sorting.

## Default Sort by Resource

| Resource | Default Sort | Justification |
|----------|-------------|---------------|
| reservations | `date ASC, time ASC` | Chronological order for daily operations |
| customers | `lastName ASC, firstName ASC` | Alphabetical for easy lookup |
| users | `createdAt DESC` | Most recent users first |
| audit_logs | `createdAt DESC` | Latest events first |
| notifications | `createdAt DESC` | Latest notifications first |
| branches | `name ASC` | Alphabetical by name |
| tables | `tableNumber ASC` | Numerical order |
| All others | `createdAt DESC` | Most recent first |

## Cross-References

- [pagination.md](./pagination.md) — Pagination always paired with stable sort
- [filtering.md](./filtering.md) — Combining sort with filters
- [endpoint-catalog.md](./endpoint-catalog.md) — Sortable fields per endpoint
