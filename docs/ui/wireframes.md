# Wireframes

**Last updated:** 2026-07-04

## Wireframe Convention

All wireframes below use the following key:

```
[SB]  Sidebar          [TB]  Top Bar
[CN]  Content Area     [BL]  Breadcrumb Line
[PT]  Page Title       [AT]  Action Toolbar
[FL]  Filter Line      [WG]  Widget / Card
[TB]  Table / List     [PG]  Pagination
```

---

## 1. Dashboard Layout (Desktop)

```
+----------+----------------------------------------------+
|          | [TB] Branch ▼  |  [Search]  🔔  👤           |
| [SB]     +----------------------------------------------+
|          | [BL] Dashboard                                  |
|  📊      +----------------------------------------------+
|  Dash    | [PT] Good morning, Jane               [AT] + Add |
|          +----------------------------------------------+
|  📅      | +----------+  +----------+  +----------+  +----------+
|  Reserv  | | Today's  |  | Expected |  | Tables   |  | Walk-ins |
|          | | Covers   |  | Guests   |  | Occupied |  | Today    |
|  👥     | | 156      |  | 42       |  | 12/20    |  | 8        |
|  Cust    | +----------+  +----------+  +----------+  +----------+
|          |                                                    |
|  🪑     | +----------------------------------------------+
|  Tables  | | Upcoming Arrivals (Next 2 Hours)               |
|          | | Name     | Time | Size | Status     | Action  |
|  🏪     | | Smith    | 7:00 | 4    | Confirmed  | Checkin |
|  Branch  | | Jones    | 7:15 | 2    | Confirmed  | Checkin |
|          | | ...      | ...  | ...  | ...        | ...     |
|  👥     | +----------------------------------------------+
|  Staff   |                                                    |
|          | +----------------------------------------------+
|  📊     | | Occupancy Chart (Line: Today vs Yesterday)      |
|  Reports | | [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]      |
|          | +----------------------------------------------+
|  🔔     |                                                    |
|  Notif   | +----------+  +----------+  +----------+          |
|          | | Top      |  | Avg      |  | Avg      |          |
|  ⚙️     | | Server   |  | Dining   |  | Party    |          |
|  Sett    | | Sarah    |  | 1h 45m   |  | 3.2      |          |
|          | +----------+  +----------+  +----------+          |
+----------+----------------------------------------------+
```

---

## 2. Reservation List View (Desktop)

```
+----------+----------------------------------------------+
| [SB]     | [TB] Branch ▼  |  [Search]  🔔  👤           |
|          +----------------------------------------------+
|          | [BL] Home > Reservations                       |
|  📅     +----------------------------------------------+
|  Reserv  | [PT] Reservations                     [AT] + New |
|          | [FL] Date: [2026-07-04 ▼] | Status: [All ▼] | Q: [___] |
|          +------------------------------------------------------------------+
|          | ☰ | Guest     | Time  | Size | Table | Status       | Actions |
|          |   | Smith, J  | 7:00  | 4    | T-12  | ✅ Confirmed | [Checkin] |
|          |   | Jones, M  | 7:15  | 2    | T-5   | 🔄 Pending   | [Edit]   |
|          |   | Lee, S    | 7:30  | 6    | T-8   | 🟢 Seated     | [View]   |
|          |   | Brown, K  | 8:00  | 3    | —     | ❌ Cancelled  | [View]   |
|          |   | ...       | ...   | ...  | ...   | ...          | ...      |
|          +------------------------------------------------------------------+
|          | [PG] < 1  2  3 ... 12 >  Showing 1-10 of 120    |
+----------+------------------------------------------------------------------+
```

---

## 3. Reservation Create Modal

```
+------------------------------------------------------------------+
|  New Reservation                                  [X] Close       |
+------------------------------------------------------------------+
|                                                                   |
|  Step 1 of 3: Guest Details                                       |
|  ┌─────────────────────────────────────────────────────────────┐  |
|  │ Search existing customer or create new                      │  |
|  │ [_________________________]  🔍                             │  |
|  │ Results:                                                    │  |
|  │ ○ John Smith - john@email.com - (555) 123-4567              │  |
|  │ ○ Create new customer                                       │  |
|  └─────────────────────────────────────────────────────────────┘  |
|                                                                   |
|  Guest Name:    [John                        ]                    |
|  Email:         [john@email.com             ]                    |
|  Phone:         [(555) 123-4567            ]                    |
|                                                                   |
|  Party Size:    [4 ▼]                                             |
|  Date & Time:   [2026-07-04]  [07:00 PM ▼]                       |
|                                                                   |
|  [Back]                                    [Next: Select Table]   |
+------------------------------------------------------------------+
```

---

## 4. Floor Plan View (Table Management)

```
+----------+----------------------------------------------+
| [SB]     | [TB] Branch ▼ (The Italian Place)  🔔  👤    |
|          +----------------------------------------------+
|          | [BL] Home > Tables > Floor Plan                |
|  🪑     +----------------------------------------------+
|  Tables  | [PT] Floor Plan                    [AT] [Edit Layout] |
|          |                                           [Add Table]  |
|          +------------------------------------------------------------------+
|          |                                                                   |
|          |      +--------+          +--------+                               |
|          |      |  T-12  |          |  T-14  |     Legend:                   |
|          |      |  4 pax |          |  2 pax |     🟢 Available              |
|          |      |  🟢   |          |  🟢   |     🔴 Occupied               |
|          |      +--------+          +--------+     🔵 Reserved               |
|          |                                                        🟡 Pending |
|          |           ════ DOOR ════                                ⚪ Blocked |
|          |                                                        🟣 Cleaning |
|          |  +--------+  +--------+  +--------+                               |
|          |  |  T-10  |  |  T-11  |  |  T-13  |                               |
|          |  |  6 pax |  |  4 pax |  |  8 pax |                               |
|          |  |  🔴   |  |  🔵   |  |  🟢   |                               |
|          |  +--------+  +--------+  +--------+                               |
|          |                                                                   |
|          |                  ════ BAR ════                                    |
|          |                                                                   |
|          |  +--------+  +--------+  +--------+  +--------+                   |
|          |  |  T-8   |  |  T-9   |  |  T-15  |  |  T-16  |                   |
|          |  |  2 pax |  |  4 pax |  |  4 pax |  |  2 pax |                   |
|          |  |  🟢   |  |  🟡   |  |  🟢   |  |  🟣   |                   |
|          |  +--------+  +--------+  +--------+  +--------+                   |
|          +------------------------------------------------------------------+
```

---

## 5. Customer Detail Page

```
+----------+----------------------------------------------+
| [SB]     | [TB]  🔔  👤                                 |
|          +----------------------------------------------+
|          | [BL] Home > Customers > John Smith            |
|  👥     +----------------------------------------------+
|  Cust    | [PT] John Smith                    [AT] [Edit] [New Reserv] |
|          +------------------------------------------------------------------+
|          | Customer Info          | Reservation History                     |
|          | ─────────────────────  | ──────────────────────────────────────  |
|          | Email: john@email.com  | Date       | Time | Size | Status      |
|          | Phone: (555) 123-4567  | 2026-07-01 | 7:00 | 4    | ✅ Seated   |
|          | Status: 🟢 Active      | 2026-06-28 | 8:30 | 2    | ❌ No-show  |
|          | Total visits: 12      | 2026-06-20 | 6:00 | 6    | ✅ Seated   |
|          | No-shows: 1           | ...        | ...  | ...  | ...         |
|          | Last visit: 2026-07-01  |                                    |
|          |                          |                                    |
|          | Notes:                   |                                    |
|          | Allergic to nuts.        |                                    |
|          | Prefers window table.    |                                    |
+----------+------------------------------------------------------------------+
```

---

## 6. Mobile Reservation List

```
+-------------------------------+
| ← Reservations      🔍 +     |
+-------------------------------+
| Date: [2026-07-04 ▼]          |
+-------------------------------+
| ┌─────────────────────────┐   |
| │ Smith, John             │   |
| │ 7:00 PM · 4 guests     │   |
| │ Table T-12 · Window     │   |
| │ ✅ Confirmed        >  │   |
| └─────────────────────────┘   |
| ┌─────────────────────────┐   |
| │ Jones, Mary             │   |
| │ 7:15 PM · 2 guests     │   |
| │ Pending                 │   |
| │ 🔄 Awaiting table   >  │   |
| └─────────────────────────┘   |
| ┌─────────────────────────┐   |
| │ Lee, Sarah              │   |
| │ 7:30 PM · 6 guests     │   |
| │ Table T-8 · Corner      │   |
| │ 🟢 Seated             >  │   |
| └─────────────────────────┘   |
+-------------------------------+
| [PG] < 1  2  3 ... >         |
+-------------------------------+
```

---

## 7. Settings Page

```
+----------+----------------------------------------------+
| [SB]     | [TB]  🔔  👤                                 |
|          +----------------------------------------------+
|          | [BL] Home > Settings                          |
|  ⚙️     +----------------------------------------------+
|  Sett    | Organization Settings                         |
|          | ────────────────────────────────────────────  |
|          | +------------------------------------------+ |
| [Org]    | | Organization Name: [The Italian Place  ]| |
| [Pol]    | | Timezone:         [(UTC-5) Eastern ▼]   | |
| [Int]    | | Currency:         [USD ▼]               | |
| [Web]    | | Default dine duration: [90] min         | |
|          | | Max party size:    [20]                  | |
|          | |                                         | |
|          | | [Save Changes]                          | |
|          | +------------------------------------------+ |
|          |                                               |
|          | Booking Policies                              |
|          | ────────────────────────────────────────────  |
|          | +------------------------------------------+ |
|          | | Advance booking window: [30] days        | |
|          | | Min notice:            [60] min           | |
|          | | Max party size:        [20]               | |
|          | | Auto-confirm:          [✅ Yes / ❌ No]   | |
|          | | ...                                       | |
|          | | [Save Changes]                            | |
|          | +------------------------------------------+ |
+----------+----------------------------------------------+
```

---

## Cross-References

- [layout-structure.md](./layout-structure.md) — Layout regions and grid
- [navigation-system.md](./navigation-system.md) — Sidebar and top bar
- [dashboard-design.md](./dashboard-design.md) — Dashboard widgets
- [reservation-flow-ui.md](./reservation-flow-ui.md) — Reservation flow wireframes
- [table-management-ui.md](./table-management-ui.md) — Floor plan details
