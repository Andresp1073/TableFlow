# Information Architecture

**Last updated:** 2026-07-04

## Navigation Structure

The app uses a **left sidebar + top bar** layout. The sidebar shows modules the user has permission to access.

### Primary Navigation (Sidebar)

```
Dashboard           → /dashboard
Reservations        → /reservations
  ├── Today         → /reservations?date=today
  ├── Calendar      → /reservations/calendar
  └── Availability  → /reservations/availability
Customers           → /customers
  ├── All           → /customers
  └── Search        → /customers?q=
Tables              → /branches/{id}/tables
  ├── Floor Plan    → /branches/{id}/tables/floor-plan
  └── Zones         → /branches/{id}/tables/zones
Branches            → /branches
  ├── List          → /branches
  └── Settings      → /branches/{id}/settings
Staff               → /users
  ├── All Staff     → /users
  └── Roles         → /roles
Reports             → /reports
  ├── Daily         → /reports/daily
  ├── Period        → /reports/period
  └── Export        → /reports/export
Notifications       → /notifications
Settings            → /settings
  ├── Organization  → /settings/organization
  ├── Policies      → /settings/policies
  ├── Integrations  → /settings/integrations
  └── Webhooks      → /settings/webhooks
Audit Logs          → /audit-logs          [admin only]
Admin               → /admin               [system admin only]
  ├── Organizations → /admin/organizations
  ├── Users         → /admin/users
  └── System        → /admin/system
```

### Secondary Navigation (Top Bar)

- Global search (command palette)
- Notifications bell
- User avatar + dropdown
  - Profile
  - Change password
  - Logout
- Branch selector (multi-branch users)

### Tertiary Navigation (Page-level)

- Tabs (e.g., Reservations: Upcoming | Past | Calendar)
- Breadcrumbs
- Action buttons (Create, Export, etc.)

## Page Hierarchy

### Levels

```
Level 0: Auth pages (login, register, forgot-password)
Level 1: Dashboard (role-aware)
Level 2: Module landing pages (list views)
Level 3: Detail pages (single entity view)
Level 4: Create/Edit (modals, not full pages)
Level 5: Settings / Configuration
```

### Module Separation

| Module | Access Level | Description |
|--------|-------------|-------------|
| Dashboard | All authenticated | Role-aware KPI widgets |
| Reservations | Staff + Manager + Admin | Core reservation operations |
| Customers | Staff + Manager + Admin | Customer profiles and history |
| Tables | Staff + Manager + Admin | Floor plan and table management |
| Branches | Manager + Admin | Branch configuration |
| Staff | Admin | User and role management |
| Reports | Manager + Admin | Analytics and exports |
| Notifications | Manager + Admin | Notification history, templates |
| Settings | Admin | Organization and system configuration |
| Audit Logs | Admin (super/admin) | Immutable event history |
| Admin | System Admin | Multi-tenant admin panel |

## Search Strategy

- **Global search** accessible from top bar (Cmd+K / Ctrl+K)
- Searches across: customers, reservations, users, branches
- Results grouped by resource type
- Quick actions within results (view, edit, call)

## Breadcrumb Pattern

```
Home > Module > Entity > Action
Example: Home > Customers > John Smith > Edit
```

## Cross-References

- [sitemap.md](./sitemap.md) — Complete URL structure
- [navigation-system.md](./navigation-system.md) — Navigation components
- [layout-structure.md](./layout-structure.md) — Page layout regions
