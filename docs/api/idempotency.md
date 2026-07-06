# Idempotency

**Last updated:** 2026-07-04

## Purpose

Idempotency ensures that repeating a request produces the same result as making it once. This is critical for reservation creation — a network retry must not create duplicate bookings.

## Idempotency Key

Clients provide an `Idempotency-Key` header for `POST` and `PATCH` requests:

```
POST /api/v1/reservations
Idempotency-Key: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Content-Type: application/json

{
  "branchId": "uuid",
  "date": "2026-07-15",
  "time": "19:00",
  "partySize": 4
}
```

## Behavior

| Scenario | Response |
|----------|----------|
| **First request** | Process normally, store result keyed by `Idempotency-Key` for 24 hours |
| **Same key, same request within 24h** | Return cached response (same status code and body) |
| **Same key, different request** | Return `422 Unprocessable Entity` — idempotency key collision |
| **No key provided** | Process normally (no idempotency guarantee) |
| **Key expired (> 24h)** | Process as new request |

## Idempotent Methods

| Method | Naturally Idempotent | Idempotency-Key Support |
|--------|---------------------|------------------------|
| `GET` | ✅ Yes | Not needed |
| `PUT` | ✅ Yes | Not needed |
| `DELETE` | ✅ Yes | Not needed |
| `POST` | ❌ No | ✅ Supported |
| `PATCH` | ❌ No | ✅ Supported |

## Cache Storage

| Attribute | Value |
|-----------|-------|
| **Storage** | Redis (key-value) |
| **TTL** | 24 hours |
| **Key format** | `idempotency:{key}:{userId}` |
| **Value** | Serialized response (status, body, headers) |
| **Cleanup** | Automatic TTL expiration |

## Idempotency-Key Requirements

| Requirement | Detail |
|-------------|--------|
| **Format** | UUID v4 (random) |
| **Uniqueness** | Must be unique per client request |
| **Regeneration** | New key for each distinct operation |
| **Retry** | Same key for retries of the same operation |

## Cross-References

- [api-standards.md](./api-standards.md) — Request headers
- [endpoint-catalog.md](./endpoint-catalog.md) — Idempotent endpoints
