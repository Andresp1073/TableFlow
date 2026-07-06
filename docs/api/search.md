# Search

**Last updated:** 2026-07-04

## Search Types

### 1. Global Search

Used for the top-level search bar across the application.

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Free-text search query |
| `scope` | string | Comma-separated resource types to search (default: all) |

```
GET /api/v1/search?q=John&scope=customers,reservations
```

**Response:**

```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "relevance": 0.95
      }
    ],
    "reservations": [
      {
        "id": "uuid",
        "confirmationCode": "TF-ABC123",
        "date": "2026-07-15",
        "customerName": "John Doe",
        "relevance": 0.82
      }
    ]
  },
  "meta": {
    "query": "John",
    "totalResults": 12,
    "scope": ["customers", "reservations"],
    "requestId": "req-uuid-v4"
  }
}
```

### 2. Module-Specific Search

Dedicated search within a single resource module.

```
GET /api/v1/customers?q=John
GET /api/v1/reservations?q=TF-ABC123
```

When `q` is provided, the endpoint performs a multi-field search across indexed columns.

### 3. Full-Text Search

For endpoints with MySQL full-text indexes, use the `search` parameter:

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Full-text search query (MySQL `MATCH ... AGAINST`) |

```
GET /api/v1/customers?search=John+Doe+example
```

**Full-text indexed tables:**

| Table | Index Name | Columns |
|-------|-----------|---------|
| customers | `ft_customers_search` | `first_name`, `last_name`, `email`, `phone` |
| audit_logs | `ft_audit_details` | `details` (JSON) |

## Search Behavior

| Scenario | Behavior |
|----------|----------|
| Empty `q` | Return unfiltered results (with pagination) |
| Very short query (< 2 chars) | Return 400 `validation.search.too_short` |
| Special characters | Escaped/sanitized to prevent injection |
| Non-indexed columns | Falls back to `LIKE '%query%'` with performance warning |
| No results | Return empty `data` array |

## Cross-References

- [filtering.md](./filtering.md) — Structured filter-based queries
- [endpoint-catalog.md](./endpoint-catalog.md) — Per-endpoint search support
