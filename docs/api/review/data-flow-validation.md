# Data Flow Validation

**Last updated:** 2026-07-04

## Request → Response Flow Analysis

### Reservation Creation Flow

```
Frontend                         API                        Service                      DB
   │                              │                           │                           │
   │  POST /api/v1/reservations   │                           │                           │
   │─────────────────────────────►│                           │                           │
   │                              │  Validate request (Zod)   │                           │
   │                              │──────────────────────────►│                           │
   │                              │                           │                           │
   │                              │  Check business rules     │                           │
   │                              │──────────────────────────►│                           │
   │                              │                           │  SELECT ... FOR UPDATE    │
   │                              │                           │──────────────────────────►│
   │                              │                           │◄──────────────────────────│
   │                              │                           │                           │
   │                              │                           │  INSERT reservation       │
   │                              │                           │──────────────────────────►│
   │                              │                           │  INSERT reservation_tables│
   │                              │                           │──────────────────────────►│
   │                              │                           │  INSERT status_history    │
   │                              │                           │──────────────────────────►│
   │                              │                           │◄─ COMMIT ─────────────────│
   │                              │◄── 201 Created ──────────│                           │
   │◄─────────────────────────────│                           │                           │
```

**Issues Found: None** — The flow is correctly designed with proper transactional boundaries and race condition protection.

### Customer Creation Flow

```
Frontend                         API                        Service                      DB
   │                              │                           │                           │
   │  POST /api/v1/customers      │                           │                           │
   │─────────────────────────────►│                           │                           │
   │                              │  Validate email/phone     │                           │
   │                              │  (unique, format)         │                           │
   │                              │──────────────────────────►│                           │
   │                              │                           │  Check duplicate email    │
   │                              │                           │──────────────────────────►│
   │                              │                           │  Check duplicate phone    │
   │                              │                           │──────────────────────────►│
   │                              │                           │  INSERT customer          │
   │                              │                           │──────────────────────────►│
   │                              │◄── 201 Created ──────────│                           │
   │◄─────────────────────────────│                           │                           │
```

**Issues Found: None** — Straightforward flow with proper duplicate checking.

### Availability Search Flow

```
Frontend                         API                        Service                      DB
   │                              │                           │                           │
   │  GET /reservations/availability                           │                           │
   │─────────────────────────────►│                           │                           │
   │                              │  Parse branchId, date,    │                           │
   │                              │  partySize                │                           │
   │                              │──────────────────────────►│                           │
   │                              │                           │  SELECT tables (active,   │
   │                              │                           │  capacity match)          │
   │                              │                           │──────────────────────────►│
   │                              │                           │  SELECT reservations      │
   │                              │                           │  (overlapping)            │
   │                              │                           │──────────────────────────►│
   │                              │                           │                           │
   │                              │  Generate slots from      │                           │
   │                              │  business hours +         │                           │
   │                              │  slot_interval            │                           │
   │                              │◄─────────────────────────│                           │
   │◄──── 200 + available slots───│                           │                           │
```

**Issue Found:** 🟡 MEDIUM — The availability query does NOT use `SELECT ... FOR UPDATE`. While availability is a read-only query, without locking, the results could be stale by the time the client submits a reservation. This is acceptable (optimistic concurrency) but should be documented.

## Response Transformation Gaps

| Source Field | API Response Field | Transformation | Status |
|-------------|-------------------|----------------|--------|
| `branches.average_dining_duration` | `averageDiningDuration` | camelCase | ✅ |
| `reservations.party_size` | `partySize` | camelCase | ✅ |
| `reservations.is_walk_in` | `isWalkIn` | camelCase | ✅ |
| `tables.position_x` | `positionX` | camelCase | ✅ |
| DB: `customers.preferences` (JSON) | `preferences` (object) | Direct mapping | ✅ |
| DB: `settings.value` (JSON) | `value` (object) | Direct mapping | ✅ |
| DB: `updated_by` → `updatedBy` | — | ❌ Not implemented | 🔴 |
| DB: `no_show_marked_at` → `noShowMarkedAt` | — | ❌ Not implemented | 🔴 |

## Batch Operations

| Operation | Approach | Issue |
|-----------|----------|-------|
| Settings bulk update | `PUT /settings/bulk` | ✅ Properly designed |
| Floor plan update | `PUT /tables/floor-plan` | ✅ Properly designed |
| Bulk reservation creation | Not designed | 🔵 LOW — may be needed |

## Async Operations

| Operation | Sync/Async | API Pattern | Status |
|-----------|-----------|-------------|--------|
| Daily summary | Sync (POST → 200) | Direct response | ✅ |
| Period summary | Async (POST → 202) | Polling via `/reports/status/{id}` | ✅ |
| Report export | Sync (GET → file) | Stream response | ✅ |

**Verdict:** ✅ Async patterns are correctly designed.

## Cross-References

- [endpoint-catalog.md](../endpoint-catalog.md) — Endpoint definitions
- [database-api-alignment.md](./database-api-alignment.md) — Field mapping
- [dto-consistency.md](./dto-consistency.md) — DTO alignment
