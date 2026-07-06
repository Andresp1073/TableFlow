# Architecture Alignment

**Last updated:** 2026-07-04

## Module Mapping: Architecture → API

| Module (module-architecture.md) | API Base Path | Status |
|--------------------------------|---------------|--------|
| Authentication | `/api/v1/auth` | ✅ |
| User Management | `/api/v1/users` | ✅ |
| Roles & Permissions | `/api/v1/roles`, `/api/v1/permissions` | ✅ |
| Restaurants | `/api/v1/organizations` | ⚠️ Name mismatch (see naming-inconsistencies.md) |
| Branches | `/api/v1/branches` | ✅ |
| Tables | `/api/v1/branches/{branchId}/tables` | ✅ |
| Reservations | `/api/v1/reservations` | ✅ |
| Customers | `/api/v1/customers` | ✅ |
| Employees | `/api/v1/branches/{branchId}/employees` | ✅ |
| Notifications | `/api/v1/notifications` | ✅ |
| Reports & Analytics | `/api/v1/reports` | ✅ |
| Dashboard | `/api/v1/dashboard` | ✅ |
| Settings | `/api/v1/settings` | ✅ |
| Audit | `/api/v1/audit-logs` | ✅ |

**Verdict:** ✅ All 14 architecture modules have corresponding API modules.

## Module Boundary Analysis

### Clean Architecture Layers

```
Controller (routes) → Service (business logic) → Repository (data access) → Prisma (DB)
```

| Module | Has Controllers | Has Services | Has Repositories | Status |
|--------|----------------|--------------|------------------|--------|
| Auth | Needs design | Needs design | Needs design | 📄 Phase 6 |
| Reservations | Needs design | Needs design | Needs design | 📄 Phase 6 |
| All others | Needs design | Needs design | Needs design | 📄 Phase 6 |

**Verdict:** ✅ No violations — the implementation layer mapping is deferred to Phase 6.

### Cross-Module Dependencies

```
Auth → Users (JWT subject)
Reservations → Customers (FK), Branches (FK), Tables (FK), Users (created_by)
Branches → Organizations (FK)
Tables → Branches (FK), Zones (FK)
Notifications → Branches (FK), Reservations (FK)
Reports → Reservations (aggregation)
Dashboard → Reservations (aggregation)
```

| Dependency | Violation | Status |
|-----------|-----------|--------|
| Reservations → Customers | Authenticated via FK | ✅ |
| Reservations → Branches | Authenticated via FK | ✅ |
| Tables → Zones | Authenticated via FK | ✅ |
| Reports → Reservations | Read-only aggregation | ✅ |
| Dashboard → Reservations | Read-only aggregation | ✅ |

**Verdict:** ✅ No cross-module violations. All dependencies are downstream (higher modules depend on lower modules).

### Orphan Endpoint Check

An orphan endpoint is one that does not belong to any defined architecture module.

| Endpoint | Module | Status |
|----------|--------|--------|
| `GET /health` | Health | ✅ Standalone (not in module list but acceptable) |
| `GET /search` | Search | ✅ Standalone cross-cutting concern |
| `GET /webhooks` | Webhooks | ✅ Future-ready module |

**Verdict:** ✅ No orphan endpoints.

## Dependency Rule Check

Clean Architecture dependency rules state that dependencies should point inward:

```
Web/UI → Controllers → Services → Repositories → Database
```

| Direction | Violation | Status |
|-----------|-----------|--------|
| Controller → Service | ✅ Correct | — |
| Service → Repository | ✅ Correct | — |
| Repository → Prisma | ✅ Correct | — |
| Service → Controller | ❌ Would violate | Not present |
| Repository → Service | ❌ Would violate | Not present |

**Verdict:** ✅ No dependency rule violations in the current design.

## Cross-References

- [module-architecture.md](../../architecture/module-architecture.md) — Architecture module definitions
- [dependency-rules.md](../../architecture/dependency-rules.md) — Dependency rules
- [naming-inconsistencies.md](./naming-inconsistencies.md) — Module naming issues
