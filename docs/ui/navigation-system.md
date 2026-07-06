# Navigation System

**Last updated:** 2026-07-04

## Navigation Hierarchy

```
Primary Navigation     → Sidebar (persistent, role-aware)
Secondary Navigation  → Top bar (global utilities)
Tertiary Navigation   → Page-level (tabs, breadcrumbs)
Quaternary Navigation → Inline (links in content)
```

---

## 1. Sidebar Navigation

### Layout

```
+---------------------------+
| [logo]     TableFlow      |  64px header
|---------------------------|
| 📊  Dashboard             |
| 📅  Reservations          |  ← Active item
|   └─ Today                |
|   └─ Calendar             |  ← Sub-item (expandable)
|   └─ Availability         |
| 👥  Customers             |
| 🪑  Table Management      |
|---------------------------|
| 🏪  Branches              |
| 👤  Staff                 |
| 📊  Reports               |
|                           |
|───────────────────────────|
| 🔔  Notifications         |
| ⚙️  Settings              |
| 📋  Audit Logs            |
|───────────────────────────|
| 🖥️  Admin Panel (sysadmin)|
|---------------------------|
| [⟨ collapse]  [🌓]  [?]  |  Footer
+---------------------------+
```

### Behavior

| Feature | Behavior |
|---------|----------|
| **Expanded width** | 280px |
| **Collapsed width** | 64px (icons only, no labels) |
| **Collapse transition** | 200ms ease |
| **Active item** | Primary-500 indicator bar + bold text |
| **Hover** | Background tint on item |
| **Groups** | Section dividers with subtle label |
| **Sub-items** | Expandable accordion (chevron icon) |
| **Permission filtering** | Items hidden when user lacks permission |
| **Multi-branch** | Branch badge shown next to modules |

### Section Groups

| Group | Items | Role |
|-------|-------|------|
| Operations | Dashboard, Reservations, Customers, Tables | All staff |
| Management | Branches, Staff, Reports | Manager+ |
| System | Notifications, Settings, Audit Logs | Admin+ |
| Admin | Admin Panel | System admin only |

---

## 2. Top Bar

### Layout

```
+------------------------------------------------------------------+
| [☰ toggle]    TableFlow    [Branch ▼]    [🔍]  [🔔 3]  [👤 ▼] |
+------------------------------------------------------------------+
```

### Elements

| Element | Behavior |
|---------|----------|
| **Hamburger** | Toggle sidebar (collapse/expand) — visible only on mobile |
| **Branch selector** | Dropdown to switch between branches (multi-branch users) |
| **Global search** | Cmd+K / Ctrl+K to open command palette; searches customers, reservations, users |
| **Notifications** | Bell icon with badge count; click opens notification panel (slide-out drawer) |
| **User avatar** | Dropdown: Profile, Change Password, Theme, Logout |

### Command Palette (Global Search)

| Feature | Detail |
|---------|--------|
| Trigger | Cmd+K (Mac) / Ctrl+K (Windows) |
| Shortcut | `/` key from anywhere |
| Results | Grouped by type (Customers, Reservations, Users, Branches) |
| Quick actions | "Go to ...", "Create reservation", "Search customer" |
| Navigation | Arrow keys + Enter to select, Escape to close |

---

## 3. Breadcrumbs

### Pattern

```
Home > Module > [Entity] > [Action]
```

### Examples

```
Home > Reservations
Home > Customers > John Smith
Home > Settings > Organization
```

### Behavior

- Last item: current page (not clickable, plain text)
- All previous items: clickable links
- Single-level pages: breadcrumbs hidden
- Mobile: show only parent level ("← Reservations")

---

## 4. Page-Level Tabs

### Usage

Used to switch between views within a single page context.

### Examples

```
Reservations: [Upcoming] [Past] [Calendar]
Customer:     [Profile] [Reservations] [Preferences]
Reports:      [Daily] [Period] [Custom]
```

### Behavior

- Active tab: underline + primary color
- Tabs overflow: horizontal scroll on mobile
- Tabs persist state in URL query params

---

## 5. Mobile Navigation

### Bottom Tab Bar (Mobile)

```
+----------------------------------+
|  📅   👥   🪑   🔔   ☰          |
| Reserv Cust Tables Notif More    |
+----------------------------------+
```

- 5 visible tabs with icons + labels
- "More" → overflow menu for remaining items
- Active tab: primary color icon + label
- Swipe gestures: swipe left/right to navigate between tabs in stack

## Cross-References

- [information-architecture.md](./information-architecture.md) — Page hierarchy
- [responsive-design.md](./responsive-design.md) — Mobile navigation behavior
- [interaction-design.md](./interaction-design.md) — Navigation interactions
