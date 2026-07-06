# User Roles

## Role Hierarchy

```
System Administrator
└── Restaurant Administrator
    ├── Receptionist
    └── Waiter
```

---

## Role Definitions

### Customer

| Attribute | Detail |
|-----------|--------|
| **Description** | End user who makes reservations at one or more restaurant branches. |
| **System Access** | Self-service portal (future phase: public booking widget). |
| **Key Actions** | View restaurant availability, make reservations, modify/cancel bookings, view reservation history. |
| **Permissions** | Read own profile, create/update/cancel own reservations. |

### Receptionist

| Attribute | Detail |
|-----------|--------|
| **Description** | Front-of-house staff responsible for managing reservations via phone, walk-in, and system. |
| **System Access** | Full reservation management, table assignment, customer lookup. |
| **Key Actions** | Create reservations on behalf of customers, assign tables, check-in guests, modify bookings. |
| **Permissions** | Read/create/update reservations, view customer profiles, view table map and availability. |

### Waiter

| Attribute | Detail |
|-----------|--------|
| **Description** | Service staff who need visibility of table assignments and status. |
| **System Access** | Read-only dashboard of assigned tables and reservations. |
| **Key Actions** | View table assignments, update table status (seated, ordering, ready to clear). |
| **Permissions** | Read reservations for assigned area, update table occupancy status. |

### Restaurant Administrator

| Attribute | Detail |
|-----------|--------|
| **Description** | Manager of a single restaurant branch or group of branches. Has full operational control. |
| **System Access** | All management modules: tables, staff, reservations, reports, settings. |
| **Key Actions** | Configure restaurant profile, manage tables and zones, create staff accounts, review analytics, export reports. |
| **Permissions** | Full CRUD on restaurant data, user management within branch, report access, system configuration. |

### System Administrator

| Attribute | Detail |
|-----------|--------|
| **Description** | Technical administrator with cross-tenant system-level access. |
| **System Access** | All modules across all organizations and branches. |
| **Key Actions** | Manage organizations, view audit logs, perform system backups, configure global settings. |
| **Permissions** | Super-admin access, cross-organization data access, system configuration, audit log review. |

---

## Permissions Matrix

| Module | Customer | Waiter | Receptionist | Restaurant Admin | System Admin |
|--------|----------|--------|--------------|-----------------|--------------|
| Reservations (own) | CRUD | R | CRUD | CRUD | CRUD |
| Reservations (all) | - | R | CRUD | CRUD | CRUD |
| Tables | - | R | R | CRUD | R |
| Customers | R | R | CRUD | CRUD | CRUD |
| Staff Accounts | - | - | - | CRUD (branch) | CRUD (global) |
| Reports | - | - | R | R | R |
| Audit Logs | - | - | - | R (branch) | R (global) |
| Settings | - | - | - | CRUD (branch) | CRUD (global) |
| Organizations | - | - | - | - | CRUD |
