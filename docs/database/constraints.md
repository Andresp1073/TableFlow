# Constraints

**Last updated:** 2026-07-04

## Primary Key Constraints

All tables use a single-column UUID v7 primary key named `id`. Associative tables use composite primary keys.

| Table | PK Column(s) | Type |
|-------|-------------|------|
| organizations | id | UUID |
| branches | id | UUID |
| users | id | UUID |
| roles | id | UUID |
| permissions | id | UUID |
| role_permissions | (role_id, permission_id) | Composite UUID |
| user_roles | (user_id, role_id, branch_id) | Composite UUID |
| employees | id | UUID |
| customers | id | UUID |
| table_zones | id | UUID |
| tables | id | UUID |
| reservations | id | UUID |
| reservation_tables | (reservation_id, table_id) | Composite UUID |
| reservation_status_history | id | UUID |
| business_hours | id | UUID |
| holiday_hours | id | UUID |
| notifications | id | UUID |
| notification_templates | id | UUID |
| audit_logs | id | UUID |
| refresh_tokens | id | UUID |
| settings | id | UUID |

---

## Foreign Key Constraints

| FK | Source Table | Source Column | Referenced Table | Referenced Column | On Delete | On Update |
|----|-------------|---------------|------------------|-------------------|-----------|-----------|
| FK_org_branch | branches | organization_id | organizations | id | RESTRICT | CASCADE |
| FK_branch_table | tables | branch_id | branches | id | CASCADE | CASCADE |
| FK_branch_zone | table_zones | branch_id | branches | id | CASCADE | CASCADE |
| FK_zone_table | tables | zone_id | table_zones | id | SET NULL | CASCADE |
| FK_branch_employee | employees | branch_id | branches | id | RESTRICT | CASCADE |
| FK_user_employee | employees | user_id | users | id | RESTRICT | CASCADE |
| FK_branch_reservation | reservations | branch_id | branches | id | RESTRICT | CASCADE |
| FK_customer_reservation | reservations | customer_id | customers | id | RESTRICT | CASCADE |
| FK_createdby_reservation | reservations | created_by | users | id | RESTRICT | CASCADE |
| FK_assignedto_reservation | reservations | assigned_to | users | id | SET NULL | CASCADE |
| FK_branch_hours | business_hours | branch_id | branches | id | CASCADE | CASCADE |
| FK_branch_holiday | holiday_hours | branch_id | branches | id | CASCADE | CASCADE |
| FK_branch_notification | notifications | branch_id | branches | id | RESTRICT | CASCADE |
| FK_reservation_notification | notifications | reservation_id | reservations | id | CASCADE | CASCADE |
| FK_branch_template | notification_templates | branch_id | branches | id | CASCADE | CASCADE |
| FK_branch_setting | settings | branch_id | branches | id | CASCADE | CASCADE |
| FK_reservation_table_res | reservation_tables | reservation_id | reservations | id | CASCADE | CASCADE |
| FK_reservation_table_tbl | reservation_tables | table_id | tables | id | RESTRICT | CASCADE |
| FK_reservation_status | reservation_status_history | reservation_id | reservations | id | CASCADE | CASCADE |
| FK_status_changedby | reservation_status_history | changed_by | users | id | SET NULL | CASCADE |
| FK_user_refreshtoken | refresh_tokens | user_id | users | id | CASCADE | CASCADE |
| FK_user_audit | audit_logs | user_id | users | id | SET NULL | CASCADE |
| FK_role_permission_role | role_permissions | role_id | roles | id | CASCADE | CASCADE |
| FK_role_permission_perm | role_permissions | permission_id | permissions | id | CASCADE | CASCADE |
| FK_userrole_user | user_roles | user_id | users | id | CASCADE | CASCADE |
| FK_userrole_role | user_roles | role_id | roles | id | RESTRICT | CASCADE |
| FK_userrole_branch | user_roles | branch_id | branches | id | CASCADE | CASCADE |

---

## Unique Constraints

| Table | Column(s) | Reason |
|-------|-----------|--------|
| users | email | Login identifier — must be unique |
| customers | email | Contact uniqueness |
| customers | phone | Contact uniqueness |
| roles | name | Role identifier — used in code |
| permissions | name | Permission identifier — used in code |
| employees | employee_code | Internal HR reference |
| reservations | confirmation_code | Customer-facing booking reference |
| branches | (organization_id, name) | No duplicate branch names within an org |
| tables | (branch_id, table_number) | No duplicate table numbers in a branch |
| business_hours | (branch_id, day_of_week) | One hour record per day per branch |
| holiday_hours | (branch_id, date) | One override per date per branch |
| table_zones | (branch_id, name) | No duplicate zone names in a branch |
| notification_templates | (branch_id, type) | One template per type per branch |
| settings | (branch_id, key) | One value per key per branch scope |

---

## Check Constraints

Check constraints are implemented at the **application layer** (Zod validation) rather than in the database. This decision ensures:

| Reason | Detail |
|--------|--------|
| **ORM compatibility** | Prisma does not natively support MySQL CHECK constraints |
| **Error consistency** | Same validation logic for API and database |
| **Schema portability** | Avoids database-specific syntax |

**Application-level validations that act as check constraints:**

| Table | Column | Constraint |
|-------|--------|------------|
| reservations | party_size | `party_size BETWEEN 1 AND 20` |
| reservations | status | `status IN ('PENDING','CONFIRMED','SEATED','COMPLETED','NO_SHOW','CANCELLED')` |
| reservations | source | `source IN ('PHONE','WALK_IN','ONLINE','STAFF')` |
| users | failed_login_attempts | `failed_login_attempts BETWEEN 0 AND 5` |
| notifications | type | `type IN ('CONFIRMATION','REMINDER','CANCELLATION','MODIFICATION')` |
| notifications | status | `status IN ('PENDING','SENT','FAILED')` |
| permissions | risk_level | `risk_level IN ('low','medium','high','critical')` |
| business_hours | day_of_week | `day_of_week BETWEEN 1 AND 7` |
| branches | average_dining_duration | `average_dining_duration BETWEEN 30 AND 240` |
| branches | max_advance_booking_days | `max_advance_booking_days BETWEEN 1 AND 365` |
| branches | slot_interval | `slot_interval IN (15, 30, 60)` |

---

## Business Constraints (Application-Layer)

These rules are enforced in the service layer, not as database constraints:

| ID | Rule | Reason |
|----|------|--------|
| BC-01 | A reservation's time must fall within the branch's operating hours | Cannot book when restaurant is closed |
| BC-02 | A reservation's date cannot exceed max_advance_booking_days | Prevents booking too far ahead |
| BC-03 | A table cannot be double-booked for overlapping time slots | Referential integrity for reservations |
| BC-04 | A reservation status can only move forward in a defined flow | PENDING→CONFIRMED→SEATED→COMPLETED |
| BC-05 | A cancelled or no-show reservation cannot be modified | Data integrity |
| BC-06 | A table can only be marked as out-of-service if no active reservations | Operational rule |
| BC-07 | A customer can be flagged after 3+ no-shows in 90 days | Business policy |

### Reservation Status Flow

```
PENDING ──► CONFIRMED ──► SEATED ──► COMPLETED
    │            │            │
    │            ▼            │
    ├────► CANCELLED          │
    │                         │
    └────► NO_SHOW ◄──────────┘
```

---

## Nullable Field Policy

| Rule | Explanation |
|------|-------------|
| Created/Updated timestamps are NEVER null | Every record must know when it was created |
| Deleted timestamps are NULLABLE | NULL = active, value = deleted |
| Foreign keys are NOT NULL unless explicitly optional | Most relationships are mandatory |
| User contact fields (phone, email) are NULLABLE for branches | A branch must exist even if contact info is pending |
| Foreign keys with ON DELETE SET NULL must be NULLABLE | They must accept null after parent deletion |

---

## Related Documents

- [table-design.md](./table-design.md) — Column-level nullability and types
- [relationships.md](./relationships.md) — Relationship cascade details
- [normalization.md](./normalization.md) — Unique constraint justification
