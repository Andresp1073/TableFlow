# Indexes

**Last updated:** 2026-07-04

## Index Design Principles

| Principle | Application |
|-----------|-------------|
| **Index by query, not by column** | Every index is justified by a specific query pattern |
| **Covering indexes** | Include all columns needed by frequent queries to avoid table lookups |
| **Composite before single** | Multi-column indexes often eliminate the need for individual indexes on leading columns |
| **Cardinality matters** | High-cardinality columns first in composite indexes |
| **Write cost** | Indexes on low-write, high-read tables are prioritized |

---

## Primary Indexes

Every table has a primary key index on `id` (UUID). Tables with composite PKs have a composite primary index.

| Table | Index Name | Columns | Purpose |
|-------|-----------|---------|---------|
| All (single PK) | `PRIMARY` | `id` | Row identity, joins |
| role_permissions | `PRIMARY` | `role_id, permission_id` | Association uniqueness |
| user_roles | `PRIMARY` | `user_id, role_id, branch_id` | Association uniqueness |
| reservation_tables | `PRIMARY` | `reservation_id, table_id` | Association uniqueness |

---

## Unique Indexes

These enforce uniqueness and serve as lookup indexes.

| Table | Index Name | Columns | Justification |
|-------|-----------|---------|---------------|
| users | `uq_users_email` | `email` | Login lookup by email |
| customers | `uq_customers_email` | `email` | Duplicate prevention, search |
| customers | `uq_customers_phone` | `phone` | Duplicate prevention, search |
| roles | `uq_roles_name` | `name` | Code-level role reference |
| permissions | `uq_permissions_name` | `name` | Code-level permission reference |
| employees | `uq_employees_code` | `employee_code` | HR lookup |
| reservations | `uq_reservations_confirmation` | `confirmation_code` | Customer lookup |
| branches | `uq_branches_org_name` | `organization_id, name` | No duplicate names in org |
| tables | `uq_tables_branch_number` | `branch_id, table_number` | No duplicate numbers |
| business_hours | `uq_hours_branch_day` | `branch_id, day_of_week` | One record per day |
| holiday_hours | `uq_holiday_branch_date` | `branch_id, date` | One override per date |
| table_zones | `uq_zones_branch_name` | `branch_id, name` | No duplicate zone names |
| notification_templates | `uq_templates_branch_type` | `branch_id, type` | One template per type |
| settings | `uq_settings_branch_key` | `branch_id, key` | One value per key |

---

## Foreign Key Indexes

MySQL does not automatically index foreign keys. Every FK column must be explicitly indexed.

| Table | Index Name | Columns | Justification |
|-------|-----------|---------|---------------|
| branches | `idx_branches_organization` | `organization_id` | Find all branches of an org |
| tables | `idx_tables_branch` | `branch_id` | Find all tables in a branch |
| tables | `idx_tables_zone` | `zone_id` | Find all tables in a zone |
| employees | `idx_employees_branch` | `branch_id` | Find all employees in a branch |
| employees | `idx_employees_user` | `user_id` | Find employee record for a user |
| reservations | `idx_reservations_branch` | `branch_id` | Branch reservation queries |
| reservations | `idx_reservations_customer` | `customer_id` | Customer history queries |
| reservations | `idx_reservations_created_by` | `created_by` | Staff activity queries |
| reservations | `idx_reservations_assigned` | `assigned_to` | Waiter's assigned reservations |
| reservation_tables | `idx_reservation_tables_table` | `table_id` | Find reservations for a table |
| reservation_status_history | `idx_status_history_reservation` | `reservation_id` | Status timeline queries |
| business_hours | `idx_hours_branch` | `branch_id` | Hours lookup |
| holiday_hours | `idx_holiday_branch` | `branch_id` | Holiday hours lookup |
| notifications | `idx_notifications_branch` | `branch_id` | Branch notification report |
| notifications | `idx_notifications_reservation` | `reservation_id` | Reservation notification history |
| notification_templates | `idx_templates_branch` | `branch_id` | Template lookup |
| audit_logs | `idx_audit_user` | `user_id` | User activity trail |
| refresh_tokens | `idx_refresh_user` | `user_id` | User's active tokens |
| settings | `idx_settings_branch` | `branch_id` | Branch settings lookup |
| user_roles | `idx_userroles_role` | `role_id` | Role assignment list |
| user_roles | `idx_userroles_branch` | `branch_id` | Branch role assignments |
| role_permissions | `idx_rolepermissions_perm` | `permission_id` | Permission usage lookup |
| reservations | `idx_reservations_updated_by` | `updated_by` | Track who last modified a reservation |
| customers | `idx_customers_updated_by` | `updated_by` | Track who last modified a customer |
| branches | `idx_branches_updated_by` | `updated_by` | Track who last modified a branch |
| tables | `idx_tables_updated_by` | `updated_by` | Track who last modified a table |

---

## Composite Query Indexes

These indexes support specific high-frequency query patterns.

| Index Name | Table | Columns | Query Pattern |
|-----------|-------|---------|---------------|
| `idx_reservations_branch_date` | reservations | `branch_id, date` | **CRITICAL**: "Show reservations for a branch on a specific date" — runs on every dashboard load |
| `idx_reservations_branch_status` | reservations | `branch_id, status` | "Show all confirmed/pending reservations for a branch" |
| `idx_reservations_date` | reservations | `date` | "Show all reservations for today across branches" (admin) |
| `idx_reservations_branch_date_status_time` | reservations | `branch_id, date, status, time` | **CRITICAL**: Availability search — "find available tables for a branch on a given date at a given time" — runs on every availability request |
| `idx_reservations_branch_date_time` | reservations | `branch_id, date, time` | Calendar view — "show reservations for a specific date ordered by time" |
| `idx_customers_search` | customers | `last_name, first_name, email` | Customer search — covers name and email lookup patterns |
| `idx_audit_time_action` | audit_logs | `created_at, action` | Audit log browsing by time range and action type |
| `idx_reservation_tables_table_assigned` | reservation_tables | `table_id, assigned_at` | Table assignment history queries |
| `idx_audit_resource` | audit_logs | `resource_type, resource_id` | "Show all audit events for this specific entity" |
| `idx_audit_created` | audit_logs | `created_at` | Time-range audit queries |
| `idx_audit_action` | audit_logs | `action` | "Find all login events" |
| `idx_refresh_active` | refresh_tokens | `user_id, is_revoked, expires_at` | "Find non-expired, non-revoked tokens for user" |
| `idx_customers_name` | customers | `last_name, first_name` | Customer search by name |
| `idx_customers_flagged` | customers | `is_flagged` | Find flagged customers |
| `idx_status_history_created` | reservation_status_history | `reservation_id, created_at` | Status timeline ordered by time |
| `idx_notifications_pending` | notifications | `status, created_at` | "Find pending notifications to process" |
| `idx_tables_active_branch` | tables | `branch_id, is_active` | "Show active tables for a branch" |

---

## Full-Text Indexes

| Table | Index Name | Columns | Justification |
|-------|-----------|---------|---------------|
| customers | `ft_customers_search` | `first_name, last_name, email, phone` | Customer search by any field |
| audit_logs | `ft_audit_details` | `details` | JSON search for investigation |

**Note:** Full-text indexes on customers enable complex search queries like "find customers whose name starts with 'John' or email contains '@gmail.com'". The audit_logs full-text index supports compliance investigations.

---

## Index Size Estimation

| Table | Row Estimate | Indexes | Estimated Index Size |
|-------|-------------|---------|---------------------|
| reservations | 5M | 10 indexes | ~600 MB |
| customers | 500K | 5 indexes | ~80 MB |
| audit_logs | 10M | 5 indexes | ~900 MB |
| notifications | 10M | 3 indexes | ~500 MB |
| reservation_status_history | 15M | 3 indexes | ~600 MB |
| Other tables | Small | 2-3 each | < 10 MB each |

---

## Index Maintenance

| Activity | Frequency | Description |
|----------|-----------|-------------|
| ANALYZE TABLE | Weekly | Update index cardinality statistics |
| Index usage analysis | Monthly | Remove unused indexes via `sys.schema_unused_indexes` |
| Rebuild fragmented indexes | Quarterly | `ALTER TABLE ... ENGINE=InnoDB` for highly fragmented indexes |

---

## Related Documents

- [table-design.md](./table-design.md) — Column definitions for indexed columns
- [performance.md](./performance.md) — Query optimization strategies
- [constraints.md](./constraints.md) — Unique constraint indexes
