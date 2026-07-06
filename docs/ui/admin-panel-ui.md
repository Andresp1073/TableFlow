# Admin Panel UI

**Last updated:** 2026-07-04

## Admin Types

| Admin Level | Scope | Pages |
|-------------|-------|-------|
| Restaurant Admin | Single org (multi-branch) | Settings, Users, Branches, Reports |
| System Admin | All orgs (platform) | Organizations, System Users, System Config |

---

## Restaurant Admin Panel

### 1. Organization Settings

```
+------------------------------------------------------------------+
| Settings  [Organization] [Policies] [Integrations] [Webhooks]    |
+------------------------------------------------------------------+
|                                                                   |
| Organization Information                                         |
| ──────────────────────────────────────────────────────────────    |
| Name:           [The Italian Place              ]                 |
| Slug:           [the-italian-place              ]                 |
| Timezone:       [(UTC-5) Eastern Time (US & Canada) ▼]           |
| Currency:       [USD ▼]                                          |
| Default language: [English ▼]                                    |
|                                                                   |
| Contact Information                                               |
| ──────────────────────────────────────────────────────────────    |
| Email:          [admin@italianplace.com        ]                 |
| Phone:          [(555) 123-4567               ]                 |
| Website:        [https://italianplace.com      ]                 |
|                                                                   |
| Branding                                                          |
| ──────────────────────────────────────────────────────────────    |
| Logo:           [Choose File]  [Preview]                          |
| Primary color:  [#3B82F6]     [Color Picker]                     |
|                                                                   |
| [Save Changes]                                                    |
+------------------------------------------------------------------+
```

### 2. User Management

```
+------------------------------------------------------------------+
| Staff                             [+ Invite User] [Roles]         |
+------------------------------------------------------------------+
| [Search by name or email...]    [Role: All ▼] [Status: All ▼]    |
+------------------------------------------------------------------+
| Name          | Email           | Role       | Branch    | Status |
| ───────────── | ─────────────── | ────────── | ───────── | ────── |
| Jane Doe      | jane@...       | Admin      | All       | 🟢     |
| John Smith    | john@...       | Manager    | Downtown  | 🟢     |
| Sarah Lee     | sarah@...      | Reception  | Downtown  | 🟢     |
| Mike Brown    | mike@...       | Waiter     | Uptown    | 🔴     |
| ...           | ...            | ...        | ...       | ...    |
+------------------------------------------------------------------+
| [PG] < 1  2  3 >  Showing 1-4 of 4                               |
+------------------------------------------------------------------+
```

#### Invite User Modal

| Field | Type | Detail |
|-------|------|--------|
| Email | Text | Required, valid email |
| First name | Text | Required |
| Last name | Text | Required |
| Role | Select | Admin, Manager, Receptionist, Waiter (from roles list) |
| Branch access | Multi-select | All branches or specific branches |

**Flow**: Send invitation email → User receives link → Set password → Redirect to dashboard.

### 3. Role Management

```
+------------------------------------------------------------------+
| Roles                            [+ Create Role]                 |
+------------------------------------------------------------------+
| Role Name    | Users | Permissions              | Actions        |
| ──────────── | ───── | ──────────────────────── | ─────────────  |
| Admin        | 2     | All permissions          | [View] [Edit]  |
| Manager      | 3     | Read + write operations  | [View] [Edit]  |
| Receptionist | 5     | Reservations, Customers  | [View] [Edit]  |
| Waiter       | 8     | Tables read, check-in    | [View] [Edit]  |
+------------------------------------------------------------------+
```

#### Edit Role Permissions

```
Role: Receptionist
┌──────────────────────────────────────────────────────────────┐
│ Module         | Permissions                                 │
│ ─────────────  | ─────────────────────────────────────────── │
│ ☐ Reservations  | ☑ Read  ☑ Create  ☑ Update  ☑ Cancel     │
│                 | ☑ Check-in  ☐ Delete  ☐ N/A               │
│ ☐ Customers     | ☑ Read  ☑ Create  ☑ Update  ☐ Delete     │
│ ☐ Tables        | ☑ Read  ☐ Create  ☐ Update  ☐ Delete     │
│ ☐ Branches      | ☐ Read  ☐ Create  ☐ Update  ☐ Delete     │
│ ...             | ...                                        │
└──────────────────────────────────────────────────────────────┘
[Save Changes] [Cancel]
```

---

## System Admin Panel

### 1. Organization List

```
+------------------------------------------------------------------+
| Organizations                    [+ Create Org] [Export CSV]      |
+------------------------------------------------------------------+
| [Search...]    [Status: All ▼]   [Plan: All ▼]                   |
+------------------------------------------------------------------+
| Org Name        | Slug     | Branches | Users | Plan    | Status  |
| ─────────────── | ──────── | ──────── | ───── | ─────── | ─────── |
| The Italian Pl. | italian  | 3        | 12    | Pro     | 🟢      |
| Sushi House     | sushi    | 1        | 5     | Starter | 🟢      |
| Burger Shack    | burger   | 2        | 8     | Pro     | 🔴      |
+------------------------------------------------------------------+
| [PG] < 1  2 >  Showing 1-3 of 3                                  |
+------------------------------------------------------------------+
```

### 2. Organization Detail

| Section | Content |
|---------|---------|
| **Summary** | Name, slug, plan tier, created date, status |
| **Branches** | List of branches with location, status, table count |
| **Users** | All users in org with roles |
| **Usage** | Monthly reservation count, storage used, API calls |
| **Billing** | Plan, payment method, invoice history |
| **Actions** | Suspend, Activate, Change plan, Delete (with confirmation) |

### 3. System Configuration

| Section | Settings |
|---------|----------|
| Platform | Max orgs, max branches per org, file upload limits |
| Security | Password policy (min length, complexity), session timeout, MFA enforcement |
| Rate Limits | Default per-plan rate limits (override per org) |
| Maintenance | Maintenance mode toggle, banner message |

---

## Admin Navigation (System Admin)

Sidebar shows additional "Admin" section (only visible to system admin):

```
Admin Panel
├── Organizations
├── Users
└── System
```

Accessible at `/admin/*`, separated from regular app routes.

---

## Audit Log Viewer

```
+------------------------------------------------------------------+
| Audit Logs                        [Export CSV] [Clear Filters]    |
+------------------------------------------------------------------+
| [Date Range: ▼] [Module: All ▼] [Action: All ▼] [User: Search]  |
+------------------------------------------------------------------+
| Timestamp           | User        | Module     | Action   | Detail          |
| ─────────────────── | ─────────── | ────────── | ──────── | ─────────────── |
| Jul 4, 2026 7:15PM | jane@...    | Reservation | CREATE   | Created R-0042  |
| Jul 4, 2026 7:10PM | jane@...    | Customer    | UPDATE   | Updated phone   |
| Jul 4, 2026 7:00PM | system      | Auth        | LOGIN    | jane@...        |
| Jul 4, 2026 6:45PM | sarah@...   | Reservation | CHECKIN  | Checked in R-40 |
+------------------------------------------------------------------+
| [PG] < 1  2  3 ... 100 >  Showing 1-25 of 2,450                  |
+------------------------------------------------------------------+
```

### Audit Log Detail (Expandable Row)

| Column | Detail |
|--------|--------|
| Timestamp | Full date + time |
| User | Name + email (system if automated) |
| Module | Reservation, Customer, Table, etc. |
| Action | CREATE, UPDATE, DELETE, CHECKIN, LOGIN, etc. |
| Details | Click to expand: IP address, user agent, previous values, new values |

---

## Cross-References

- [information-architecture.md](./information-architecture.md) — Admin page hierarchy
- [sitemap.md](./sitemap.md) — Admin URL structure
- [component-library.md](./component-library.md) — Tables, modals, selects
