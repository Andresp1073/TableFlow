# Roles

## Role Hierarchy

```
System Administrator
├── Support
└── Restaurant Administrator
    └── Restaurant Manager
        ├── Receptionist
        └── Waiter
```

Unauthenticated users (including Customers) are not part of the hierarchy and have no system role until they register.

---

## Role Definitions

### Customer

| Attribute | Detail |
|-----------|--------|
| **ID** | `customer` |
| **Purpose** | Allow diners to manage their own reservations through a self-service interface. |
| **Scope** | Own data only |
| **Hierarchy Level** | 0 (lowest) |

**Responsibilities:**
- Create, view, modify, and cancel own reservations.
- Maintain own profile information.
- Respond to confirmation and reminder notifications.

**Allowed Actions:**
- Register and manage own account.
- Browse restaurant availability (public).
- Create reservations for self and guests.
- Modify or cancel own reservations within policy limits.
- View own reservation history.

**Restrictions:**
- Cannot access other customers' data.
- Cannot manage tables, staff, or restaurant settings.
- Cannot view operational reports or analytics.
- Cannot create reservations on behalf of others.

**Relationships:**
- Interacts with Receptionist for phone reservations.
- Receives notifications from the system.

---

### Waiter

| Attribute | Detail |
|-----------|--------|
| **ID** | `waiter` |
| **Purpose** | Provide service staff with visibility of table assignments and the ability to update table status during service. |
| **Scope** | Assigned tables and sections only |
| **Hierarchy Level** | 1 |

**Responsibilities:**
- View tables assigned to their section.
- Update table status as guests are seated, served, and finished.
- Communicate table readiness to reception.

**Allowed Actions:**
- View reservations for assigned tables/section.
- View table floor plan and status.
- Update table status (occupied, ready to clear, available).
- View own schedule (future).

**Restrictions:**
- Cannot create or modify reservations.
- Cannot access customer payment or contact details beyond what is necessary.
- Cannot manage other staff accounts.
- Cannot access reports, settings, or audit logs.

**Relationships:**
- Reports to Restaurant Manager.
- Coordinates with Receptionist on table turnover.
- Works alongside other waiters in the same section.

---

### Receptionist

| Attribute | Detail |
|-----------|--------|
| **ID** | `receptionist` |
| **Purpose** | Enable front-of-house staff to manage the full reservation lifecycle efficiently. |
| **Scope** | Assigned branch |
| **Hierarchy Level** | 2 |

**Responsibilities:**
- Handle incoming reservation requests (phone, email, walk-in).
- Assign tables and manage the floor plan during service.
- Check in arriving guests and manage no-shows.
- Provide customer service at the front desk.

**Allowed Actions:**
- Create, read, update, and cancel reservations.
- Assign and release tables.
- Search and view customer profiles.
- Check in and check out guests.
- Mark no-shows.
- View daily/weekly reservation calendar.
- View table floor plan with real-time status.
- Add internal notes to reservations.

**Restrictions:**
- Cannot manage staff accounts.
- Cannot modify restaurant settings or policies.
- Cannot delete customer profiles.
- Cannot access audit logs.
- Cannot export reports.

**Relationships:**
- Reports to Restaurant Manager.
- Works closely with Waiters for table turnover.
- Primary interface for Customers during phone/walk-in bookings.

---

### Restaurant Manager

| Attribute | Detail |
|-----------|--------|
| **ID** | `restaurant_manager` |
| **Purpose** | Provide operational oversight of a single restaurant branch with supervisory capabilities. |
| **Scope** | Single branch |
| **Hierarchy Level** | 3 |

**Responsibilities:**
- Supervise reception and waitstaff.
- Monitor daily operations and resolve conflicts.
- Review performance metrics and adjust staffing.
- Handle escalated customer issues.

**Allowed Actions:**
- All Receptionist actions.
- View and export operational reports.
- Manage table configurations within the branch.
- View staff schedules.
- Override reservation blocks or restrictions.
- Access branch-level audit logs.

**Restrictions:**
- Cannot create or delete staff accounts.
- Cannot modify branch-level settings (hours, policies).
- Cannot manage other branches.
- Cannot access system-level configuration.

**Relationships:**
- Reports to Restaurant Administrator.
- Supervises Receptionists and Waiters.
- Escalates to Restaurant Administrator for policy changes.

---

### Restaurant Administrator

| Attribute | Detail |
|-----------|--------|
| **ID** | `restaurant_admin` |
| **Purpose** | Provide full administrative control over one or more restaurant branches within an organization. |
| **Scope** | Organization-wide (all branches) |
| **Hierarchy Level** | 4 |

**Responsibilities:**
- Configure restaurant profiles, hours, and policies.
- Manage staff accounts (create, modify, deactivate).
- Oversee all branches under the organization.
- Approve configuration changes.
- Manage billing and subscription (future).

**Allowed Actions:**
- All Restaurant Manager actions across all branches.
- Create, update, and deactivate staff accounts.
- Configure restaurant settings (hours, policies, notifications).
- Manage table layouts and zones for all branches.
- View cross-branch reports and analytics.
- Export system-wide reports.
- Access audit logs for all branches.
- Configure notification templates and preferences.

**Restrictions:**
- Cannot access other organizations' data.
- Cannot modify system-level settings (infrastructure, global config).
- Cannot delete the organization.
- Cannot change own role.

**Relationships:**
- Reports to System Administrator for platform-level concerns.
- Oversees Restaurant Managers across branches.
- Point of contact for organization-level decisions.

---

### Support

| Attribute | Detail |
|-----------|--------|
| **ID** | `support` |
| **Purpose** | Enable technical support staff to assist restaurant users with system issues and troubleshooting. |
| **Scope** | Read access across organizations, limited write access |
| **Hierarchy Level** | 4 |

**Responsibilities:**
- Respond to support tickets from restaurant staff.
- Diagnose configuration and usage issues.
- Escalate bugs and technical issues to development team.
- Maintain knowledge base articles.

**Allowed Actions:**
- View any restaurant's configuration and settings.
- View user accounts and roles.
- View audit logs for troubleshooting.
- View reports (read-only).
- Impersonate a user session for debugging (logged).
- Submit bug reports.

**Restrictions:**
- Cannot create, modify, or cancel reservations.
- Cannot modify restaurant settings or configurations.
- Cannot create or delete user accounts.
- Cannot access sensitive customer data beyond what is necessary for support.
- Cannot export reports.

**Relationships:**
- Reports to System Administrator.
- Interfaces with Restaurant Administrators and Managers.
- Escalates to Developers for code-level issues.

---

### System Administrator

| Attribute | Detail |
|-----------|--------|
| **ID** | `system_admin` |
| **Purpose** | Provide full system-level control over the entire platform, including multi-tenant administration. |
| **Scope** | Global (all organizations, all data) |
| **Hierarchy Level** | 5 (highest) |

**Responsibilities:**
- Manage organizations and their lifecycle.
- Create and manage System-level settings.
- Monitor system health and performance.
- Perform backup and recovery operations.
- Review all audit logs.
- Manage global role templates and permission sets.

**Allowed Actions:**
- All actions across all modules for all organizations.
- Create and delete organizations.
- Assign and revoke any role.
- Configure global system settings.
- Access and manage all audit logs.
- Perform system backups and recovery.
- Manage role definitions and permission templates.

**Restrictions:**
- Cannot delete own account.
- All actions are audited.

**Relationships:**
- Highest authority in the system.
- Delegates organization management to Restaurant Administrators.
- Oversees Support team.
- Interfaces with DevOps and development teams for infrastructure.

---

## Role Comparison

| Aspect | Customer | Waiter | Receptionist | Restaurant Manager | Restaurant Admin | Support | System Admin |
|--------|----------|--------|--------------|--------------------|-----------------|---------|--------------|
| **Scope** | Own data | Assigned section | Single branch | Single branch | Organization | Cross-org (read) | Global |
| **Hierarchy Level** | 0 | 1 | 2 | 3 | 4 | 4 | 5 |
| **Manage Reservations** | Own only | View only | Full | Full | Full | View only | Full |
| **Manage Tables** | No | View + status | View + assign | Full | Full | View only | Full |
| **Manage Staff** | No | No | No | No | Yes | View only | Yes |
| **Manage Settings** | No | No | No | View only | Yes | View only | Yes |
| **View Reports** | No | No | Operational | Operational + Export | Cross-branch | Read-only | Full |
| **Audit Logs** | No | No | No | Branch-level | Organization | Read-only | Full |
