# Architecture Review

**Last updated:** 2026-07-04

## Overall Architecture Assessment

The database architecture follows a sound canonical data model design. However, several architectural decisions need reevaluation for an enterprise SaaS context.

---

## 1. Multi-Tenancy Architecture

| Aspect | Current Design | Review Finding |
|--------|---------------|----------------|
| Tenant isolation | Row-level via `organization_id` | Adequate for 100s of restaurants. Insufficient for 1000+ due to shared index contention |
| Tenant key propagation | Implicit — each branch has `organization_id`, reservations have `branch_id` | Correct. Chain is: org → branch → reservation |
| Cross-tenant queries | No isolation documented | Admin dashboards will query across organizations. Must use separate read replicas |

**Recommendation:** Add a documented **tenant context** pattern — every query must filter by `organization_id` (directly or through a join to branches). No cross-tenant query should scan the entire table.

---

## 2. Settings as Key-Value Pattern

| Concern | Detail |
|---------|--------|
| **Current design** | `settings(branch_id, key, value)` with JSON value |
| **Problem** | Settings are not typed, not indexed by content, not cached. Every settings lookup hits the database. |
| **Impact** | Settings are read on every page load (hours, policies, branch config). This adds 50-100ms to every request. |

**Recommendation:** Add an in-memory cache layer for settings documentation. The architecture document should specify which settings are cached and for how long (e.g., business hours: 1 hour TTL, reservation policies: 5 minutes TTL).

---

## 3. Audit Log Insert Pattern

| Concern | Detail |
|---------|--------|
| **Current design** | Synchronous INSERT to audit_logs for every action |
| **Problem** | A reservation create triggers: INSERT reservation + INSERT reservation_tables + INSERT status_history + INSERT audit_log. The audit log write adds latency to the main transaction. |
| **Impact** | At 5M reservations/year, audit_log grows by 10M rows/year. Insert performance degrades. |

**Recommendation:** Document an **async audit log pattern** using an in-process event buffer that flushes every 100ms or every 100 events. Critical events (payments, account changes) can remain synchronous.

---

## 4. Reservation Overlap Detection

| Concern | Detail |
|---------|--------|
| **Current design** | Application-layer overlap check before reservation creation |
| **Problem** | MySQL has no exclusion constraint. Two concurrent requests can pass the application check simultaneously (race condition). |
| **Impact** | Double-booking scenario. |

**Recommendation:** Document the use of `SELECT ... FOR UPDATE` on the `reservations` and `reservation_tables` rows being checked. The entire availability check + insert must be in a **serializable transaction**.

---

## 5. ENUM Handling Strategy

| Concern | Detail |
|---------|--------|
| **Current design** | VARCHAR(20) for all enum-like columns (status, type, source, risk_level) |
| **Problem** | No database-level validation. A direct INSERT or UPDATE can set an invalid status. |
| **Impact** | Data integrity risk. |

**Recommendation:** Document the use of **MySQL CHECK constraints** (available in MySQL 8.0.16+) for critical enums: `reservations.status`, `reservations.source`, `notifications.type`, `notifications.status`. Prisma supports this via `@@schema` validation.

---

## 6. Schema Migration Strategy

| Concern | Detail |
|---------|--------|
| **Current design** | Prisma migrations with backward-compatible pattern |
| **Problem** | No documented rollback strategy for failed migrations. Prisma does not support rollbacks natively. |
| **Impact** | A broken migration can take the database down for hours. |

**Recommendation:** Document a **migration rollback procedure**: (1) take a backup before every migration, (2) keep the previous migration file, (3) `prisma migrate diff` to create a reversal migration.

---

## 7. Connection Pool Management

| Concern | Detail |
|---------|--------|
| **Current design** | Prisma default connection limit (10) |
| **Problem** | At 200 concurrent users, 10 connections will be exhausted. All requests queue up. |
| **Impact** | Request timeouts, cascading failures. |

**Recommendation:** Document connection pool sizing:
```
Expected concurrent requests: 200
Average query time: 50ms
Connections needed: (200 × 0.05) / (1 - 0.2) ≈ 13
With headroom: 50 connections
MySQL max_connections: 200 (accounting for admin + batch)
```

---

## Summary of Architectural Changes Required

| Change | Priority | Effort |
|--------|----------|--------|
| Add `SELECT ... FOR UPDATE` pattern for reservation creation | 🔴 Critical | Low |
| Document connection pool sizing | 🟡 High | Low |
| Add CHECK constraints for critical enums | 🟡 High | Low |
| Document async audit log pattern | 🟡 High | Medium |
| Add settings caching strategy | 🟡 Medium | Low |
| Document migration rollback procedure | 🟢 Medium | Low |
| Document tenant context query pattern | 🟢 Low | Low |
