# Filtering

**Last updated:** 2026-07-04

## Approach

Filters are specified as query parameters using a **prefix convention** for filter operators. All filter parameters are combined with AND logic.

## Operator Prefixes

| Operator | Prefix | Example | Description |
|----------|--------|---------|-------------|
| Exact match | (none) | `?status=CONFIRMED` | Field equals value |
| Negation | `ne_` | `?ne_status=CANCELLED` | Field does not equal value |
| Greater than | `gt_` | `?gt_partySize=4` | Field > value |
| Greater or equal | `gte_` | `?gte_createdAt=2026-06-01` | Field >= value |
| Less than | `lt_` | `?lt_partySize=10` | Field < value |
| Less or equal | `lte_` | `?lte_createdAt=2026-07-04` | Field <= value |
| In list | `in_` | `?in_status=CONFIRMED,SEATED,COMPLETED` | Field in comma-separated list |
| Not in list | `nin_` | `?nin_status=CANCELLED,NO_SHOW` | Field not in comma-separated list |
| Contains (string) | `like_` | `?like_firstName=John` | Field contains substring |
| Starts with | `sw_` | `?sw_email=john` | Field starts with value |
| Ends with | `ew_` | `?ew_email=@gmail.com` | Field ends with value |
| Is null | `isnull_` | `?isnull_cancelledAt` | Field is NULL (value ignored) |
| Is not null | `notnull_` | `?notnull_assignedTo` | Field is not NULL |

## Date Range

| Pattern | Example |
|---------|---------|
| Single date | `?date=2026-07-15` |
| Date range | `?gte_date=2026-07-01&lte_date=2026-07-31` |
| Before date | `?lt_date=2026-08-01` |
| After date | `?gt_date=2026-06-30` |

## Boolean

| Pattern | Example | Behavior |
|---------|---------|----------|
| True | `?isActive=true` | `is_active = TRUE` |
| False | `?isActive=false` | `is_active = FALSE` |

## Combination Examples

```
# Reservations for a specific branch, confirmed or seated, on a specific date
GET /api/v1/reservations?branchId=uuid&in_status=CONFIRMED,SEATED&date=2026-07-15

# Customers with > 3 no-shows, flagged, not deleted
GET /api/v1/customers?gt_totalNoshows=3&isFlagged=true&isnull_deletedAt

# Audit logs for a specific resource in a date range
GET /api/v1/audit-logs?resourceType=reservation&resourceId=uuid&gte_createdAt=2026-07-01&lte_createdAt=2026-07-31

# Recent confirmed reservations for a branch (today onwards)
GET /api/v1/reservations?branchId=uuid&status=CONFIRMED&gte_date=2026-07-04&sortBy=date,sortDirection=ASC
```

## Endpoint-Specific Filter Documentation

Each endpoint in the [endpoint-catalog.md](./endpoint-catalog.md) documents which filter parameters are supported.

## Cross-References

- [pagination.md](./pagination.md) — Combining filters with pagination
- [sorting.md](./sorting.md) — Combining filters with sort
- [search.md](./search.md) — Full-text search vs filtered search
- [endpoint-catalog.md](./endpoint-catalog.md) — Per-endpoint filter support
