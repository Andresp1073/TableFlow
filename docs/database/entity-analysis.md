# Entity Analysis

**Last updated:** 2026-07-04

## Entity Catalog

### 1. organizations

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Represents a restaurant company (tenant). Enables multi-tenancy at the organization level. |
| **Why it exists** | A SaaS platform serving multiple restaurant chains requires tenant isolation. Every branch belongs to one organization. |
| **Examples** | "Bella Italia Group", "Sushi World Inc." |

### 2. branches

| Attribute | Detail |
|-----------|--------|
| **Purpose** | A single physical restaurant location. |
| **Why it exists** | A restaurant organization can have multiple locations. Each branch has its own tables, hours, staff, and reservations. |
| **Examples** | "Bella Italia Downtown", "Bella Italia Airport" |

### 3. users

| Attribute | Detail |
|-----------|--------|
| **Purpose** | System users — staff members, administrators, support personnel. |
| **Why it exists** | Authentication and authorization require user accounts. Every person who logs into the system is a user. |
| **Note** | Customers are NOT users. Customers are tracked in the `customers` table. |

### 4. roles

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Named collections of permissions. |
| **Why it exists** | RBAC requires roles as an abstraction layer between users and permissions. Simplifies permission management. |
| **Examples** | `restaurant_admin`, `receptionist`, `waiter`, `system_admin` |

### 5. permissions

| Attribute | Detail |
|-----------|--------|
| **Purpose** | A discrete action that can be performed in the system. |
| **Why it exists** | Granular access control requires defined permissions. Each permission maps to one or more API operations. |
| **Examples** | `reservations.create`, `tables.assign`, `users.manage` |

### 6. role_permissions (associative)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Maps permissions to roles. |
| **Why it exists** | Many-to-many relationship between roles and permissions. A role can have many permissions; a permission can belong to many roles. |

### 7. user_roles (associative)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Assigns roles to users with optional branch scope. |
| **Why it exists** | A user can have multiple roles (e.g., receptionist at one branch, manager at another). The branch_id scope enables this. |

### 8. employees

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Links a user to a branch as an employee with position and hire date. |
| **Why it exists** | Not every user is an employee (e.g., system admins, support). Employee-specific data (hire date, position) doesn't belong in the `users` table. |

### 9. customers

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Diner profiles with contact info, preferences, and visit history. |
| **Why it exists** | Restaurants need to track their guests for marketing, service personalization, and no-show management. Separate from users because customers don't log into the system (initially). |

### 10. tables

| Attribute | Detail |
|-----------|--------|
| **Purpose** | A physical table in a restaurant branch with capacity and position. |
| **Why it exists** | Reservations require tables. Tables have capacity, location, and status that change over time. |

### 11. table_zones

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Grouping of tables into sections (patio, indoor, bar, VIP room). |
| **Why it exists** | Restaurants organize tables into zones for floor plan management and waiter section assignment. |

### 12. reservations

| Attribute | Detail |
|-----------|--------|
| **Purpose** | A booking made by a customer for a specific date, time, and party size at a branch. |
| **Why it exists** | This is the central entity of the system. The entire platform exists to manage reservations and their lifecycle. |

### 13. reservation_tables (associative)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Links reservations to the specific tables assigned. |
| **Why it exists** | A reservation can span multiple tables (merged tables for large parties). A table can be linked to multiple reservations (time-separated). |

### 14. reservation_status_history

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Tracks every status change of a reservation over time. |
| **Why it exists** | Required for audit, dispute resolution, and analytics (e.g., how long does a reservation stay in "pending" before confirmation). |

### 15. business_hours

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Standard operating hours for each day of the week per branch. |
| **Why it exists** | Restaurants have different hours on different days. The system uses these to validate reservation times. |

### 16. holiday_hours

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Override operating hours for specific dates (holidays, special events). |
| **Why it exists** | Holidays often have different hours. These overrides take precedence over business_hours for matching dates. |

### 17. notifications

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Records of sent notifications (email, in-app) for traceability. |
| **Why it exists** | Restaurants need to know if a customer was notified, when, and whether delivery succeeded. |

### 18. notification_templates

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Reusable notification templates for different event types. |
| **Why it exists** | Allows restaurants to customize notification content without code changes. |

### 19. audit_logs

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Immutable log of all system-critical events. |
| **Why it exists** | Compliance, security investigation, and troubleshooting require a tamper-proof event trail. |

### 20. refresh_tokens

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Stores JWT refresh token hashes for session management. |
| **Why it exists** | Refresh token rotation requires tracking issued tokens and their revocation status. |

### 21. settings

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Key-value store for branch and organization configuration. |
| **Why it exists** | Avoids schema changes for every new configuration option. Allows flexible, dynamic configuration. |

### 22. payments (future)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Records of payments collected for reservations (deposits, pre-payments). |
| **Why it exists** | Future feature: restaurants may require deposits for large parties or special events. |

---

## Entity Classification

| Classification | Entities |
|---------------|----------|
| **Core Business** | organizations, branches, tables, table_zones, reservations, customers |
| **Identity & Access** | users, roles, permissions, role_permissions, user_roles, refresh_tokens |
| **Operations** | employees, business_hours, holiday_hours, reservation_tables |
| **Communication** | notifications, notification_templates |
| **Configuration** | settings |
| **Audit & Compliance** | audit_logs, reservation_status_history |
| **Future** | payments, payment_methods |

---

## Related Documents

- [table-design.md](./table-design.md) — Column-level design for every entity
- [relationships.md](./relationships.md) — Entity relationship details
- [normalization.md](./normalization.md) — Normalization analysis
