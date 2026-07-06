# Permissions Catalog

This document defines every permission in the TableFlow system. Permissions are organized by module and follow a consistent naming convention: `{module}.{action}`.

---

## Permission Naming Convention

```
{resource}.{verb}
```

Where `resource` is the domain entity and `verb` is the operation. Common verbs: `create`, `read`, `update`, `delete`, `manage`, `assign`, `confirm`, `cancel`, `export`, `view`.

---

## Risk Levels

| Level | Description |
|-------|-------------|
| **Low** | Read-only or non-sensitive operations. Minimal impact if misused. |
| **Medium** | Data modification within a restricted scope. Moderate impact. |
| **High** | Destructive operations, sensitive data access, or cross-tenant actions. Critical impact. |
| **Critical** | System-level configuration, user management, audit access. Maximum impact. |

---

## Module: Authentication

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-001 | `auth.register` | Register a new user account | Low |
| PERM-002 | `auth.login` | Authenticate and obtain access tokens | Low |
| PERM-003 | `auth.logout` | Invalidate current session | Low |
| PERM-004 | `auth.refresh` | Refresh an expired access token | Low |
| PERM-005 | `auth.resetPassword` | Request and complete password reset | Medium |
| PERM-006 | `auth.changePassword` | Change own password while authenticated | Low |

## Module: Users

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-007 | `users.create` | Create new user accounts | High |
| PERM-008 | `users.read` | View user profile and account details | Medium |
| PERM-009 | `users.update` | Modify user profile information | Medium |
| PERM-010 | `users.delete` | Permanently delete user accounts | Critical |
| PERM-011 | `users.disable` | Deactivate a user account | High |
| PERM-012 | `users.enable` | Reactivate a disabled user account | High |
| PERM-013 | `users.list` | List all users with filters | Medium |
| PERM-014 | `users.changeRole` | Change a user's assigned role | Critical |
| PERM-015 | `users.invite` | Send account invitation to a new user | High |

## Module: Roles & Permissions

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-016 | `roles.create` | Create a new custom role | Critical |
| PERM-017 | `roles.read` | View role definitions and assigned permissions | Medium |
| PERM-018 | `roles.update` | Modify role name, description, or permissions | Critical |
| PERM-019 | `roles.delete` | Delete a custom role | Critical |
| PERM-020 | `roles.list` | List all available roles | Low |
| PERM-021 | `roles.assign` | Assign a role to a user | High |

## Module: Restaurants

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-022 | `restaurants.create` | Create a new restaurant organization | High |
| PERM-023 | `restaurants.read` | View restaurant profile and configuration | Low |
| PERM-024 | `restaurants.update` | Update restaurant profile (name, logo, contact) | Medium |
| PERM-025 | `restaurants.delete` | Delete a restaurant organization and all associated data | Critical |
| PERM-026 | `restaurants.list` | List all restaurant organizations | Medium |

## Module: Branches

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-027 | `branches.create` | Create a new restaurant branch | High |
| PERM-028 | `branches.read` | View branch details and configuration | Low |
| PERM-029 | `branches.update` | Update branch profile and settings | Medium |
| PERM-030 | `branches.delete` | Delete a branch and all associated data | Critical |
| PERM-031 | `branches.list` | List all branches within an organization | Low |
| PERM-032 | `branches.configureHours` | Configure branch operating hours and holidays | Medium |
| PERM-033 | `branches.configurePolicies` | Configure reservation policies per branch | Medium |

## Module: Tables

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-034 | `tables.create` | Add a new table to the floor plan | Medium |
| PERM-035 | `tables.read` | View table details and status | Low |
| PERM-036 | `tables.update` | Modify table configuration (capacity, location, zone) | Medium |
| PERM-037 | `tables.delete` | Remove a table from the floor plan | High |
| PERM-038 | `tables.list` | List all tables in a branch | Low |
| PERM-039 | `tables.assign` | Assign a specific table to a reservation | Medium |
| PERM-040 | `tables.release` | Release a table from a reservation | Medium |
| PERM-041 | `tables.updateStatus` | Update table occupancy status | Low |
| PERM-042 | `tables.merge` | Merge two or more tables into one | Medium |
| PERM-043 | `tables.split` | Split a merged table back into individual tables | Medium |
| PERM-044 | `tables.disable` | Mark a table as out of service | Medium |
| PERM-045 | `tables.configureLayout` | Configure the visual floor plan layout | Medium |

## Module: Reservations

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-046 | `reservations.create` | Create a new reservation | Medium |
| PERM-047 | `reservations.read` | View reservation details | Low |
| PERM-048 | `reservations.update` | Modify an existing reservation | Medium |
| PERM-049 | `reservations.delete` | Delete a reservation from the system | High |
| PERM-050 | `reservations.cancel` | Cancel a reservation with reason | Medium |
| PERM-051 | `reservations.confirm` | Confirm a pending reservation | Medium |
| PERM-052 | `reservations.checkIn` | Check in a guest upon arrival | Low |
| PERM-053 | `reservations.checkOut` | Check out a guest and release table | Low |
| PERM-054 | `reservations.markNoShow` | Mark a reservation as no-show | Medium |
| PERM-055 | `reservations.list` | List reservations with filters | Low |
| PERM-056 | `reservations.searchAvailability` | Search available time slots | Low |
| PERM-057 | `reservations.autoAssign` | Automatically assign the best available table | Low |
| PERM-058 | `reservations.manageRecurring` | Create and manage recurring reservations | Medium |
| PERM-059 | `reservations.addNotes` | Add internal notes to a reservation | Low |
| PERM-060 | `reservations.manageWalkIn` | Create walk-in reservations | Medium |
| PERM-061 | `reservations.overrideBlock` | Override reservation blocks or restrictions | High |

## Module: Customers

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-062 | `customers.create` | Create a new customer profile | Low |
| PERM-063 | `customers.read` | View customer profile and visit history | Medium |
| PERM-064 | `customers.update` | Modify customer profile information | Medium |
| PERM-065 | `customers.delete` | Delete a customer profile | High |
| PERM-066 | `customers.list` | List customers with search and filters | Medium |
| PERM-067 | `customers.merge` | Merge duplicate customer profiles | High |
| PERM-068 | `customers.flag` | Flag a customer as high-risk (no-show pattern) | Medium |
| PERM-069 | `customers.addNotes` | Add notes to a customer profile | Low |
| PERM-070 | `customers.export` | Export customer data | High |

## Module: Notifications

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-071 | `notifications.send` | Manually trigger a notification | Medium |
| PERM-072 | `notifications.viewLog` | View notification delivery log | Low |
| PERM-073 | `notifications.configureTemplates` | Configure notification message templates | Medium |
| PERM-074 | `notifications.configurePreferences` | Configure notification preferences per branch | Medium |
| PERM-075 | `notifications.retry` | Retry failed notification delivery | Low |

## Module: Reports & Analytics

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-076 | `reports.view` | View operational reports on screen | Low |
| PERM-077 | `reports.export` | Export reports as CSV or PDF | Medium |
| PERM-078 | `reports.viewDashboard` | View the main analytics dashboard | Low |
| PERM-079 | `reports.configureMetrics` | Configure which metrics appear on reports | Medium |
| PERM-080 | `reports.schedule` | Schedule automated report generation | Medium |

## Module: Dashboard

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-081 | `dashboard.view` | View the main operational dashboard | Low |
| PERM-082 | `dashboard.customize` | Customize dashboard widgets and layout | Low |

## Module: Settings

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-083 | `settings.view` | View system and branch settings | Low |
| PERM-084 | `settings.updateGeneral` | Update general settings (name, contact, time zone) | Medium |
| PERM-085 | `settings.updateReservationPolicies` | Update reservation policy settings | Medium |
| PERM-086 | `settings.updateNotificationPreferences` | Update notification preferences | Medium |
| PERM-087 | `settings.updateBusinessHours` | Update operating hours and holiday schedule | Medium |
| PERM-088 | `settings.manageIntegrations` | Manage third-party integrations | High |

## Module: Audit Logs

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-089 | `audit.read` | View audit log entries | High |
| PERM-090 | `audit.readSensitive` | View sensitive audit entries (auth changes, role changes) | Critical |
| PERM-091 | `audit.export` | Export audit logs | Critical |
| PERM-092 | `audit.configureRetention` | Configure audit log retention policy | Critical |

## Module: Organizations (Multi-Tenant)

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-093 | `organizations.create` | Create a new tenant organization | Critical |
| PERM-094 | `organizations.read` | View organization details | High |
| PERM-095 | `organizations.update` | Update organization information | Critical |
| PERM-096 | `organizations.delete` | Delete an organization and all its data | Critical |
| PERM-097 | `organizations.list` | List all organizations in the system | Critical |
| PERM-098 | `organizations.manageSubscription` | Manage organization subscription and billing | High |

## Module: System

| ID | Name | Description | Risk |
|----|------|-------------|------|
| PERM-099 | `system.viewHealth` | View system health status | Low |
| PERM-100 | `system.manageBackup` | Perform and manage system backups | Critical |
| PERM-101 | `system.manageRecovery` | Perform system recovery operations | Critical |
| PERM-102 | `system.viewLogs` | View system-level application logs | High |
| PERM-103 | `system.configureGlobal` | Configure global system settings | Critical |
