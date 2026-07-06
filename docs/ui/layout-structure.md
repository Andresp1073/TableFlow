# Layout Structure

**Last updated:** 2026-07-04

## Application Shell

The app uses a persistent shell layout that wraps all authenticated pages.

```
+---------------------------------------------------+
| [Top Bar]  Brand  |  Branch ▼  |  🔍  |  🔔  |  👤  |
|-------------------+-------------------------------+
|           |                                          |
|  [Sidebar] |        [Content Area]                   |
|           |                                          |
|  📊       |  [Breadcrumb]                            |
|  Dashboard |  [Page Title + Actions]                  |
|           |  [Filters / Search]                       |
|  📅       |  ┌─────────────────────────────────┐     |
|  Reserv   |  │                                 │     |
|           |  │  Main Content                    │     |
|  👥      |  │  (scrolls independently)         │     |
|  Cust     |  │                                 │     |
|           |  │                                 │     |
|  🪑      |  └─────────────────────────────────┘     |
|  Tables   |  [Footer: minimal, version info]          |
|           |                                          |
|  🏪      |                                          |
|  Branch   |                                          |
|           |                                          |
|  ...      |                                          |
|           |                                          |
+-----------+------------------------------------------+
```

## Layout Regions

### Top Bar (fixed, 56px height)

| Section | Content |
|---------|---------|
| Left | Logo / Brand mark + Branch selector |
| Center | — |
| Right | Global search (Cmd+K), Notifications bell with badge, User avatar + dropdown |

### Sidebar (fixed, 280px expanded / 64px collapsed)

| Section | Content |
|---------|---------|
| Top | Logo / App name |
| Middle | Navigation items (grouped by module) |
| Bottom | Collapse toggle, Help link, Theme toggle |

### Content Area (scrollable)

| Zone | Description |
|------|-------------|
| Breadcrumb | `< Home > Reservations` |
| Page Header | Title + action buttons |
| Filter Bar | Filters, search, view toggles |
| Main | Table, cards, chart, or form |
| Pagination | (if list view) |
| Footer | Version number, copyright |

## Grid System

```yaml
breakpoints:
  sm: 1 column (full width)
  md: 2 columns
  lg: 3 columns
  xl: 4 columns
  gap: 16px (spacing-4)
  padding: 16px mobile, 24px tablet, 32px desktop
```

## Page Layout Variants

### List Page (e.g., Reservations)

| Region | Layout |
|--------|--------|
| Header | Title left, actions right |
| Filters | Full-width bar below header |
| Content | Full-width table or card grid |
| Pagination | Bottom-center |

### Detail Page (e.g., Customer View)

| Region | Layout |
|--------|--------|
| Header | Title left, actions right |
| Content | Two-column: primary info left, secondary/related right |
| Sections | Horizontal tabs or vertical sections |

### Dashboard

| Region | Layout |
|--------|--------|
| Header | Greeting + date, actions right |
| KPI Row | 4 cards in a row (responsive grid) |
| Charts | 2-column grid |
| Recent Activity | Full-width list below charts |

### Form Page (e.g., Settings)

| Region | Layout |
|--------|--------|
| Header | Title left |
| Navigation | Vertical tabs (sub-settings) left |
| Content | Form fields in single column, max-width 720px |

## Content Width

| Breakpoint | Max Content Width |
|------------|-------------------|
| < md | 100% |
| md-lg | 100% |
| xl+ | 1280px (centered) |

## Z-Index Stack

| Layer | Z-Index | Elements |
|-------|---------|----------|
| Base | 0 | Page content |
| Sticky | 10 | Top bar, sidebar |
| Dropdown | 30 | Dropdown menus, tooltips |
| Modal | 40 | Modals |
| Toast | 50 | Toast notifications |
| Loading | 60 | Full-page loader overlay |

## Cross-References

- [navigation-system.md](./navigation-system.md) — Sidebar and top bar detail
- [responsive-design.md](./responsive-design.md) — Responsive layout behavior
- [wireframes.md](./wireframes.md) — Visual layout examples
