# Dashboard Design

**Last updated:** 2026-07-04

## Dashboard Types

| Dashboard | User Role | Purpose |
|-----------|-----------|---------|
| **Staff Dashboard** | Receptionist, Waiter | Daily operations — today's reservations, arrivals, quick actions |
| **Manager Dashboard** | Restaurant Manager | Operations overview — KPIs, trends, alerts |
| **Admin Dashboard** | Restaurant Admin | Full business view — multi-branch, reports |
| **System Dashboard** | System Admin | Platform-wide metrics — organizations, users, system health |

---

## Staff Dashboard Layout

```
+------------------------------------------------------------------+
| Good morning, Jane!          Tue, Jul 4, 2026     [Quick Add +]  |
+------------------------------------------------------------------+
| +----------+ +----------+ +----------+ +----------+               |
| | Today's  | | Expected | | Tables   | | Walk-ins |               |
| | Covers   | | Guests   | | Occupied | | Today    |               |
| |   156    | |    42    | |  12 / 20 | |    8     |               |
| | 📈 +12%  | |  7:30 PM | |   60%    | |          |               |
| +----------+ +----------+ +----------+ +----------+               |
|                                                                   |
| +------------------------------------------------------------+   |
| | Upcoming Arrivals (Next 2 Hours)          [View All →]     |   |
| |------------------------------------------------------------|   |
| | Time  | Guest        | Size | Status     | Table | Action  |   |
| | 7:00  | Smith, J     | 4    | ✅ Conf.  | T-12  | [Checkin]|
| | 7:15  | Jones, M     | 2    | 🔄 Pend.  | —     | [Assign] |
| | 7:30  | Lee, S       | 6    | ✅ Conf.  | T-8   | [Checkin]|
| | 7:45  | Brown, K     | 3    | ✅ Conf.  | —     | [Checkin]|
| | 8:00  | Wilson, T    | 5    | 🔄 Pend.  | —     | [Assign] |
| +------------------------------------------------------------+   |
|                                                                   |
| +------------------+ +------------------+                        |
| | Floor Plan Mini  | | Today's Trend    |                        |
| | [grid of tables] | | [sparkline]      |                        |
| | 12/20 occupied   | | Peak at 8 PM     |                        |
| +------------------+ +------------------+                        |
+------------------------------------------------------------------+
```

### Staff Dashboard Widgets

| Widget | Content | Refresh |
|--------|---------|---------|
| Today's Covers | Total reservations count + % vs same day last week | On load |
| Expected Guests | Total guest count for remaining arrivals | Realtime |
| Tables Occupied | Usage fraction + percentage | Realtime |
| Walk-ins Today | Walk-in count for today | On action |
| Upcoming Arrivals | Reservations list (next 2h) with check-in actions | Realtime (SSE) |
| Floor Plan Mini | Compact table grid with status colors | Realtime |
| Today's Trend | Sparkline chart showing reservation density by hour | On load |

### Quick Actions

| Action | Opens |
|--------|-------|
| + Quick Add | Create reservation modal (pre-filled: today, now) |
| Check-in | Mark guest as seated |
| Assign | Assign table to pending reservation |

---

## Manager Dashboard Widgets

| Widget | Content |
|--------|---------|
| Today's Overview | Covers, occupancy %, avg party size |
| Weekly Trend | 7-day line chart of covers vs last week |
| Staff Performance | Top servers by covers served |
| Alerts | Low availability flags, no-show rate alerts |
| Customer Insights | New vs returning customers ratio |
| Reservation Status | Pie chart: confirmed vs pending vs cancelled |
| Peak Hours | Heatmap of busy hours across the week |

---

## KPI Card Design

```
+---------------------------+
| 📈                        | ← Icon (optional)
| 156                       | ← Primary metric (large font)
| Today's Covers            | ← Label
| ↑ 12% vs last week       | ← Trend indicator
+---------------------------+
```

### KPI Variants

| Metric Type | Trend Indicator | Color |
|-------------|----------------|-------|
| Positive | ↑ 12% | success-500 |
| Negative | ↓ 3% | error-500 |
| Neutral | → 0% | neutral-500 |

---

## Chart Types

| Chart | Use Case |
|-------|----------|
| Line chart | Daily/weekly trends (covers, occupancy) |
| Bar chart | Comparison (staff performance, branch comparison) |
| Pie chart | Distribution (status breakdown, time-of-day) |
| Sparkline | Compact trend in KPI cards |
| Heatmap | Peak hours / busy periods table |

### Chart Conventions

- All charts: responsive, touch-interactive on mobile
- Tooltip on hover/tap with exact values
- Loading state: skeleton chart (animated bar/line placeholders)
- Empty state: "No data available for this period"
- Download as PNG/CSV option on detail view

---

## Empty Dashboard State

```
+------------------------------------------------------------------+
|                     Welcome to TableFlow!                         |
|                                                                   |
|           [🎉 Illustration: Calendar with checkmark]              |
|                                                                   |
|   You don't have any reservations yet.                            |
|                                                                   |
|   [Create your first reservation]  [Import from CSV]              |
|                                                                   |
|   📖 Quick tips:                                                  |
|   • Add your restaurant branches in Settings                      |
|   • Configure your table layout in Table Management               |
|   • Invite your staff in Staff Management                         |
+------------------------------------------------------------------+
```

## Cross-References

- [wireframes.md](./wireframes.md) — Dashboard wireframe ASCII
- [layout-structure.md](./layout-structure.md) — Dashboard layout zones
- [component-library.md](./component-library.md) — KPI card, table, chart components
- [empty-loading-error-states.md](./empty-loading-error-states.md) — Empty and loading states
