# Relationships

**Last updated:** 2026-07-04

## Relationship Types

| Type | Count | Description |
|------|-------|-------------|
| One-to-Many (1:N) | 18 | Dominant relationship type |
| Many-to-Many (N:M) | 3 | Resolved via associative tables |
| One-to-One (1:1) | 0 | None required |
| Self-referential | 0 | None required |

---

## One-to-Many Relationships

### 1. organizations → branches

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | An organization (restaurant company) can have multiple physical locations. Each branch belongs to exactly one organization. |
| **FK** | `branches.organization_id` → `organizations.id` |
| **Cascade** | RESTRICT — cannot delete an organization with active branches |

### 2. branches → tables

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A branch has many physical tables. A table belongs to exactly one branch. |
| **FK** | `tables.branch_id` → `branches.id` |
| **Cascade** | CASCADE — deleting a branch removes its tables |

### 3. branches → employees

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A branch employs many staff members. An employee works at exactly one branch. |
| **FK** | `employees.branch_id` → `branches.id` |
| **Cascade** | RESTRICT — cannot delete a branch with active employees |

### 4. branches → reservations

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A branch receives many reservations. Each reservation is for exactly one branch. |
| **FK** | `reservations.branch_id` → `branches.id` |
| **Cascade** | RESTRICT |

### 5. branches → business_hours

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A branch has 7 business hour records (one per day). Each record belongs to exactly one branch. |
| **FK** | `business_hours.branch_id` → `branches.id` |
| **Cascade** | CASCADE |

### 6. branches → holiday_hours

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A branch can have multiple holiday hour overrides. |
| **FK** | `holiday_hours.branch_id` → `branches.id` |
| **Cascade** | CASCADE |

### 7. branches → notifications

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A branch sends many notifications. |
| **FK** | `notifications.branch_id` → `branches.id` |
| **Cascade** | RESTRICT |

### 8. branches → settings

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A branch has multiple configuration settings. |
| **FK** | `settings.branch_id` → `branches.id` |
| **Cascade** | CASCADE |

### 9. customers → reservations

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A customer can make many reservations across different branches and dates. A reservation belongs to exactly one customer. |
| **FK** | `reservations.customer_id` → `customers.id` |
| **Cascade** | RESTRICT — cannot delete a customer with reservation history |

### 10. users → reservations (created_by)

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A staff user can create many reservations. Tracks who created each booking. |
| **FK** | `reservations.created_by` → `users.id` |
| **Cascade** | RESTRICT |

### 11. users → employees

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A user can be an employee at multiple branches (e.g., manager of multiple locations). |
| **FK** | `employees.user_id` → `users.id` |
| **Cascade** | RESTRICT |

### 12. users → notifications_context (assigned_to)

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A reservation can be assigned to a waiter for service. |
| **FK** | `reservations.assigned_to` → `users.id` |
| **Cascade** | SET NULL |

### 13. tables → table_zones

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A zone groups many tables. A table belongs to at most one zone. |
| **FK** | `tables.zone_id` → `table_zones.id` |
| **Cascade** | SET NULL |

### 14. reservations → reservation_status_history

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A reservation has many status changes over its lifecycle. Each history record belongs to one reservation. |
| **FK** | `reservation_status_history.reservation_id` → `reservations.id` |
| **Cascade** | CASCADE |

### 15. reservations → notifications

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A reservation can trigger multiple notifications (confirmation, reminder, cancellation). |
| **FK** | `notifications.reservation_id` → `reservations.id` |
| **Cascade** | CASCADE |

### 16. roles → user_roles

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A role can be assigned to many users. |
| **FK** | `user_roles.role_id` → `roles.id` |
| **Cascade** | RESTRICT — cannot delete a role that is in use |

### 17. users → user_roles

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A user can have multiple roles (possibly at different branches). |
| **FK** | `user_roles.user_id` → `users.id` |
| **Cascade** | CASCADE |

### 18. users → audit_logs

| Attribute | Detail |
|-----------|--------|
| **Type** | 1:N |
| **Why** | A user performs many auditable actions. |
| **FK** | `audit_logs.user_id` → `users.id` |
| **Cascade** | SET NULL — preserve audit log even if user is deleted |

---

## Many-to-Many Relationships

### 1. roles ↔ permissions (role_permissions)

| Attribute | Detail |
|-----------|--------|
| **Type** | N:M resolved by associative table `role_permissions` |
| **Why** | A role can have many permissions. A permission can belong to many roles. This enables flexible RBAC where system_admin might have all permissions while receptionist has a subset. |
| **Template** | `role_permissions(role_id, permission_id)` |

### 2. reservations ↔ tables (reservation_tables)

| Attribute | Detail |
|-----------|--------|
| **Type** | N:M resolved by associative table `reservation_tables` |
| **Why** | A reservation can include multiple tables (merged tables for large parties). A table can be linked to multiple reservations over different time slots. |
| **Template** | `reservation_tables(reservation_id, table_id, assigned_at)` |

### 3. users ↔ roles with branch scope (user_roles)

| Attribute | Detail |
|-----------|--------|
| **Type** | N:M resolved by associative table `user_roles` |
| **Why** | A user can have multiple roles, possibly scoped to different branches. A role can be assigned to many users. The `branch_id` nullable field adds scope granularity. |
| **Template** | `user_roles(user_id, role_id, branch_id)` |

---

## Key Relationship Design Decisions

| Decision | Rationale |
|----------|-----------|
| **user_roles has branch scope** | A user can be a receptionist at Branch A and a manager at Branch B. Without branch_id, the user would need separate accounts. |
| **employees is separate from users** | Not all users are employees (system admins, support). Employee-specific data (position, hire date) shouldn't clutter the users table. |
| **reservation_tables is a separate table** | A reservation can span multiple tables (merge). Including a `table_id` directly in reservations would limit it to one table per reservation. |
| **customers are not users** | Customers don't log in (initially). Their data structure (preferences, visit count, no-show tracking) differs significantly from user accounts. |
| **notifications has branch_id** | Notifications are sent by a branch, for a specific reservation. branch_id enables branch-scoped notification reporting. |

---

## Cascade Rules Summary

| Rule | Tables |
|------|--------|
| **CASCADE** | branches→tables, branches→business_hours, branches→holiday_hours, branches→settings, reservations→status_history, reservations→notifications, users→user_roles |
| **RESTRICT** | organizations→branches, branches→employees, branches→reservations, branches→notifications, customers→reservations, users→reservations, roles→user_roles |
| **SET NULL** | tables→zone_id, reservations→assigned_to, audit_logs→user_id |

---

## Related Documents

- [entity-relationship.md](./entity-relationship.md) — ER diagrams
- [constraints.md](./constraints.md) — Foreign key constraint details
- [table-design.md](./table-design.md) — Column-level foreign key definitions
