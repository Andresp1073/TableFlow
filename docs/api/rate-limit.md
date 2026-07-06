# Rate Limiting

**Last updated:** 2026-07-04

## Strategy

TableFlow uses a **token bucket** algorithm for rate limiting. Limits are applied per authenticated user (or per IP for unauthenticated endpoints).

## Rate Limit Tiers

| Tier | Window | Limit | Applied To |
|------|--------|-------|------------|
| **Auth** | 1 minute | 10 | Login, register, forgot password, reset password |
| **General** | 1 minute | 200 | All authenticated API requests |
| **Availability** | 1 minute | 60 | `GET /api/v1/reservations/availability` |
| **Reports** | 1 hour | 10 | Report generation endpoints |
| **Bulk** | 1 minute | 20 | Bulk create/update operations |
| **Webhooks** | 1 minute | 100 | Webhook delivery attempts |

## Response Headers

Every response includes rate limit headers:

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Max requests per window | `200` |
| `X-RateLimit-Remaining` | Remaining in current window | `195` |
| `X-RateLimit-Reset` | Unix timestamp when window resets | `1704068100` |

## Rate Limit Exceeded Response

When a client exceeds the rate limit:

**Status:** `429 Too Many Requests`

```json
{
  "success": false,
  "data": null,
  "meta": { "requestId": "req-uuid-v4" },
  "error": {
    "code": "rate_limit.exceeded",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 45,
      "limit": 200,
      "resetAt": 1704068100
    }
  }
}
```

## Rate Limit Exclusions

| Scenario | Not Counted |
|----------|-------------|
| Internal service-to-service | Requests with internal API key header |
| Webhook callbacks | Webhook delivery retries |
| Health checks | `GET /api/v1/health` |

## Rate Limit Configuration

| Parameter | Default | Environment Variable |
|-----------|---------|---------------------|
| Auth limit | 10/min | `RATE_LIMIT_AUTH` |
| General limit | 200/min | `RATE_LIMIT_GENERAL` |
| Availability limit | 60/min | `RATE_LIMIT_AVAILABILITY` |
| Report limit | 10/hr | `RATE_LIMIT_REPORT` |
| Burst allowance | 20% above limit | `RATE_LIMIT_BURST` |

## Cross-References

- [api-standards.md](./api-standards.md) — Response headers
- [request-response-standards.md](./request-response-standards.md) — Error response format
- [error-catalog.md](./error-catalog.md) — Error code `rate_limit.exceeded`
