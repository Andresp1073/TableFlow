# Constraint Review

**Last updated:** 2026-07-04

## Primary Key Review

| Table | PK Type | Assessment |
|-------|---------|------------|
| All tables (22) | UUID v7 | Good choice for distributed systems |

**Concern:** UUID v7 requires a library that generates time-ordered values. If the library produces UUID v4 (random), index fragmentation will be severe.

**Recommendation:** Verify UUID v7 library generates monotonic time-ordered values. Test with 1M inserts and measure index page splits.

---

## Foreign Key Review

### Complete FK Coverage

| Source Table | Referenced Table | Status | Review |
|-------------|------------------|--------|--------|
| branches | organizations | ✅ | Correct |
| tables | branches | ✅ | Correct |
| tables | table_zones | ✅ | Correct |
| reservations | branches | ✅ | Correct |
| reservations | customers | ✅ | Correct |
| reservations | users (created_by) | ✅ | Correct |
| reservations | users (assigned_to) | ✅ | Correct |
| reservation_tables | reservations | ✅ | Correct |
| reservation_tables | tables | 🔴 **RESTRICT issue** | Should be CASCADE |
| reservation_status_history | reservations | ✅ | Correct |
| notification_templates | branches | ✅ | Correct |
| notifications | branches | ✅ | Correct |
| notifications | reservations | ✅ | Correct |
| audit_logs | users | ✅ | Correct |
| refresh_tokens | users | ✅ | Correct |
| settings | branches | ✅ | Correct |
| role_permissions | roles | ✅ | Missing cascade |
| role_permissions | permissions | ✅ | Missing cascade |
| user_roles | users | ✅ | Correct |
| user_roles | roles | ✅ | Correct |
| user_roles | branches | ✅ | Correct |

### Cascade Rule Issues

| FK | Current Rule | Recommended Rule | Reason |
|----|-------------|-----------------|--------|
| reservation_tables → tables | RESTRICT | CASCADE | Historical table assignments should not block table deletion |
| role_permissions → roles | Not specified | CASCADE | Junction table cleanup |
| role_permissions → permissions | Not specified | CASCADE | Junction table cleanup |
| notifications → reservations | CASCADE | SET NULL on reservation_id | If a reservation is cleaned up, the notification record (confirmations sent) should be preserved for audit |
| reservations → assigned_to | SET NULL | ✅ Correct | Waiter leaving should not invalidate reservations |

---

## Unique Constraint Review

| Table | Constraint | Assessment |
|-------|-----------|------------|
| users.email | UNIQUE | ✅ Correct |
| customers.email | UNIQUE | ✅ Correct |
| customers.phone | UNIQUE | ✅ Correct |
| roles.name | UNIQUE | ✅ Correct |
| permissions.name | UNIQUE | ✅ Correct |
| employees.employee_code | UNIQUE | ✅ Correct |
| reservations.confirmation_code | UNIQUE | ✅ Correct |
| (branch_id, name) on branches | UNIQUE | ✅ Correct |
| (branch_id, table_number) on tables | UNIQUE | ✅ Correct |
| (branch_id, day_of_week) on business_hours | UNIQUE | ✅ Correct |
| (branch_id, date) on holiday_hours | UNIQUE | ✅ Correct |
| (branch_id, name) on table_zones | UNIQUE | ✅ Correct |
| (branch_id, type) on notification_templates | UNIQUE | ✅ Correct |
| (branch_id, key) on settings | UNIQUE | ✅ Correct |

**Missing Unique Constraints:**

| Table | Missing Constraint | Impact |
|-------|-------------------|--------|
| user_roles | `(user_id, role_id, COALESCE(branch_id, UUID_TO_BIN('00000000-0000-0000-0000-000000000000')))` | Duplicate role assignments possible |
| reservation_tables | No constraint on `(table_id, date, time)` pair | Race condition could double-book |
| reservation_status_history | No constraint on `(reservation_id, created_at, to_status)` | Duplicate status entries possible |

---

## Missing Check Constraints

MySQL 8.0.16+ supports CHECK constraints. The following should be added:

```sql
-- Reservations status
ALTER TABLE reservations ADD CONSTRAINT chk_reservations_status
CHECK (status IN ('PENDING','CONFIRMED','SEATED','COMPLETED','NO_SHOW','CANCELLED'));

-- Reservations source
ALTER TABLE reservations ADD CONSTRAINT chk_reservations_source
CHECK (source IN ('PHONE','WALK_IN','ONLINE','STAFF'));

-- Reservations party_size
ALTER TABLE reservations ADD CONSTRAINT chk_reservations_party_size
CHECK (party_size >= 1 AND party_size <= 20);

-- Notifications type
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_type
CHECK (type IN ('CONFIRMATION','REMINDER','CANCELLATION','MODIFICATION'));

-- Notifications status
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_status
CHECK (status IN ('PENDING','SENT','FAILED'));

-- Business hours consistency
ALTER TABLE business_hours ADD CONSTRAINT chk_hours_consistency
CHECK (
    (is_closed = 1 AND open_time IS NULL AND close_time IS NULL)
    OR
    (is_closed = 0 AND open_time IS NOT NULL AND close_time IS NOT NULL)
);

-- Permissions risk_level
ALTER TABLE permissions ADD CONSTRAINT chk_permissions_risk
CHECK (risk_level IN ('low','medium','high','critical'));

-- Failed login attempts
ALTER TABLE users ADD CONSTRAINT chk_users_failed_login
CHECK (failed_login_attempts >= 0 AND failed_login_attempts <= 5);
```

---

## Nullable Field Review

| Table | Nullable Field | Assessment |
|-------|---------------|------------|
| customers | `notes`, `preferences` | Acceptable — optional data |
| reservations | `cancellation_reason`, `special_requests`, `internal_notes` | Acceptable — optional data |
| reservations | `assigned_to` | Acceptable — not all reservations have a waiter assigned |
| reservations | `checked_in_at`, `checked_out_at`, `cancelled_at`, `no_show_marked_at` | Acceptable — set only when event occurs |
| audit_logs | `user_id` | Acceptable — system actions have no user |
| audit_logs | `details`, `ip_address`, `user_agent` | Acceptable — not always available |
| notifications | `reservation_id` | Acceptable — some notifications are not reservation-specific |
| notification_templates | `branch_id` | Acceptable — null = system default |
| settings | `branch_id` | Acceptable — null = organization-level setting |

**Missing nullable issue:** `branches.phone` and `branches.email` are nullable. A branch without contact info may be acceptable during setup but should have a warning.

---

## Summary

| Constraint Issue | Severity | Action |
|-----------------|----------|--------|
| No CHECK constraints on enums | 🔴 High | Add MySQL 8 CHECK constraints |
| reservation_tables → tables RESTRICT | 🟡 Medium | Change to CASCADE |
| No overlap protection on reservation_tables | 🔴 High | Add application-level FOR UPDATE |
| Duplicate user_roles possible | 🟡 Medium | Add unique constraint |
| Notifications cascade on reservation delete | 🟡 Medium | Change to SET NULL |
| Missing CHECK on business_hours consistency | 🟡 Medium | Add constraint |
