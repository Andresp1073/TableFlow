# Audit Strategy

**Last updated:** 2026-07-04

## Audit Architecture

TableFlow uses a **hybrid audit approach**: application-level logging for rich context plus database-level triggers for guaranteed capture.

```
┌─────────────────────────────────────────────┐
│         Application-Level Audit              │
│  (Primary — captures rich context)          │
│                                              │
│  • User ID (who)                             │
│  • Action (what)                             │
│  • Resource type + ID (what)                 │
│  • Before/after values (details)             │
│  • IP address + user agent (where)           │
│  • Correlation ID (trace)                    │
│  • Timestamp (when)                          │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│         Database-Level Audit                 │
│  (Secondary — guaranteed capture)           │
│                                              │
│  • Reservation status changes (trigger)     │
│  • Created/Updated/Deleted timestamps       │
│  • Soft delete timestamps                   │
└─────────────────────────────────────────────┘
```

---

## Audit Tables

### audit_logs (Application)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Who performed the action (nullable for system) |
| action | VARCHAR(100) | Action identifier (e.g., 'reservation.cancel') |
| resource_type | VARCHAR(50) | Entity type (e.g., 'reservation') |
| resource_id | VARCHAR(36) | Entity UUID |
| details | JSON | Before/after values, additional context |
| ip_address | VARCHAR(45) | Client IP |
| user_agent | VARCHAR(500) | Browser/agent string |
| created_at | DATETIME(3) | Immutable timestamp |

**Actions to audit:**

| Module | Actions |
|--------|---------|
| Auth | login.success, login.failure, logout, password.change, password.reset, account.lock, account.unlock |
| Users | user.create, user.update, user.delete, user.disable, user.enable, user.role.change |
| Roles | role.create, role.update, role.delete, permission.assign |
| Reservations | reservation.create, reservation.update, reservation.cancel, reservation.confirm, reservation.checkin, reservation.checkout, reservation.noshow, reservation.assign_table |
| Customers | customer.create, customer.update, customer.delete, customer.merge, customer.flag |
| Restaurants | restaurant.create, restaurant.update, restaurant.delete |
| Branches | branch.create, branch.update, branch.delete, branch.hours.change |
| Tables | table.create, table.update, table.delete, table.disable |
| Settings | settings.update |
| Reports | report.export |

### reservation_status_history (Trigger)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| reservation_id | UUID | FK to reservations |
| from_status | VARCHAR(20) | Previous status |
| to_status | VARCHAR(20) | New status |
| changed_by | UUID | FK to users |
| reason | VARCHAR(500) | Optional reason |
| created_at | DATETIME(3) | Immutable timestamp |

---

## Audit Fields on Every Table

Every table includes standard audit timestamp fields:

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | DATETIME(3) | When the record was created (set once, never modified) |
| `updated_at` | DATETIME(3) | When the record was last modified (auto-update) |

Critical tables (reservations, customers, branches, tables) also include:

| Field | Type | Description |
|-------|------|-------------|
| `updated_by` | UUID | FK → users.id — who last modified the record |

Tables supporting soft delete also include:

| Field | Type | Description |
|-------|------|-------------|
| `deleted_at` | DATETIME(3) | When the record was soft-deleted (NULL = active) |

---

## Audit Data Capture Points

| Layer | Capture Point | Data Captured |
|-------|---------------|---------------|
| **Middleware** | Auth middleware | Failed/successful login attempts |
| **Middleware** | RBAC middleware | Forbidden access attempts |
| **Service layer** | Business logic | Reservation create/update/cancel |
| **Service layer** | User management | User create/update/role change |
| **Repository layer** | Write operations | Resource modification (future: rich diff) |
| **Database trigger** | Status changes | Reservation status history |
| **Database trigger** | Counter updates | Customer visit/no-show counts |

---

## Audit Log Retention

| Log Type | Retention | Action After Retention |
|----------|-----------|----------------------|
| audit_logs | 12 months | Archive to cold storage, then delete |
| reservation_status_history | Permanent | Never deleted (reservation lifecycle) |
| application logs (Pino) | 30 days | Automatically rotated |

### Archival Strategy

```
audit_logs older than 12 months:
    1. Export to JSON/CSV
    2. Compress and store in S3/GCS
    3. Delete from MySQL
    4. Record archive manifest in a separate archive_logs table
```

---

## Audit Log Immutability

| Rule | Enforcement |
|------|-------------|
| No UPDATE on audit_logs | Application code never updates audit records |
| No DELETE on audit_logs | Application code never deletes audit records |
| No UPDATE on reservation_status_history | Trigger inserts only, never modifies |
| API access to audit_logs | READ-ONLY via reports and admin panel |

---

## Performance Considerations

| Challenge | Mitigation |
|-----------|------------|
| High write volume on audit_logs | Batch inserts (buffer 100 events before writing) |
| audit_logs growing to 10M+ rows | Partition by month (range partitioning on created_at) |
| Frequent audit queries | Indexes on (resource_type, resource_id) and (user_id) |
| Audit impacting transaction performance | Async audit logging (event-driven, non-blocking) |

---

## Related Documents

- [triggers.md](./triggers.md) — Database triggers for audit
- [logging-strategy.md](../architecture/logging-strategy.md) — Application logging strategy
- [table-design.md](./table-design.md) — Audit table column definitions
