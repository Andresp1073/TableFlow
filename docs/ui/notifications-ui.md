# Notifications UI

**Last updated:** 2026-07-04

---

## Notification Types

| Type | Source | Priority | Delivery |
|------|--------|----------|----------|
| Reservation created | System | Normal | In-app, email (customer) |
| Reservation cancelled | System | Normal | In-app |
| Reservation modified | System | Normal | In-app |
| Guest checked in | System | Low | In-app |
| No-show marked | Staff | Normal | In-app |
| Table ready for cleaning | Staff | Low | In-app |
| Low availability alert | System | High | In-app + email |
| Staff invited | Admin | Normal | Email |
| Password changed | System | High | Email |
| System announcement | Admin | Varies | In-app + email |

---

## Notification Center Panel

### Slide-out Drawer

Triggered by bell icon in top bar. Opens from right side (400px wide).

```
┌──────────────────────────────────┐
│ Notifications          [Mark all]│
│ ──────────────────────────────── │
│ [All] [Unread] [Filter ▼]       │
│                                  │
│ 🔴 Today                         │
│ ┌──────────────────────────────┐ │
│ │ 🔴 10:30 AM                  │ │
│ │ Reservation #0042 cancelled  │ │
│ │ by John Smith                 │ │
│ │                        [Dismiss]│ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ 🟡 9:15 AM                   │ │
│ │ Low availability: only 3     │ │
│ │ tables left for 7 PM slot    │ │
│ │                        [View] │ │
│ └──────────────────────────────┘ │
│                                  │
│ 🟢 Yesterday                     │
│ ┌──────────────────────────────┐ │
│ │ ✅ 8:00 PM                   │ │
│ │ 45 reservations created      │ │
│ │ today (new record)           │ │
│ └──────────────────────────────┘ │
│                                  │
│ [View All Notifications →]      │
└──────────────────────────────────┘
```

### Notification Card

| Element | Detail |
|---------|--------|
| Icon | Priority-coded (🔴 High, 🟡 Normal, 🟢 Low) |
| Title | Notification type (bold if unread) |
| Description | Context detail |
| Timestamp | Relative ("10m ago", "2h ago") or absolute for older |
| Action | "Dismiss", "View", "Check-in", etc. |
| Click card | Navigate to relevant page (reservation detail, etc.) |

---

## Notification History Page

### `/notifications` Page

```
+------------------------------------------------------------------+
| Notifications                     [Mark All Read] [Settings]      |
+------------------------------------------------------------------+
| [All] [Unread] [Reservations] [System] [Alerts]                  |
| [Date Range: Last 7 days ▼]                                      |
+------------------------------------------------------------------+
| ┌──────────────────────────────────────────────────────────────┐ |
| │ ◉ Reservation #0042 cancelled by John Smith        12:30 PM  │ |
| │   Table T-12 is now available                                │ |
│ │                                              [Dismiss]      │ |
| └──────────────────────────────────────────────────────────────┘ |
| ┌──────────────────────────────────────────────────────────────┐ |
| │ ◎ Guest checked in: John Smith (4 guests)         11:45 AM  │ |
| │   T-12 marked as occupied                                    │ |
| │                                              [Dismiss]      │ |
| └──────────────────────────────────────────────────────────────┘ |
| ┌──────────────────────────────────────────────────────────────┐ |
| │ ◉ Low availability: only 2 tables left for 8 PM    10:30 AM │ |
| │   Consider adjusting reservation capacity                    │ |
| │                                              [Dismiss]      │ |
| └──────────────────────────────────────────────────────────────┘ |
+------------------------------------------------------------------+
| [PG] Showing 1-10 of 45                                          |
+------------------------------------------------------------------+
```

### Status Indicators

| Indicator | Meaning |
|-----------|---------|
| ◉ Blue dot | Unread notification |
| ◎ No dot | Read notification |
| 🔴 Red icon | High priority |
| 🟡 Amber icon | Normal priority |
| 🟢 Green icon | Low priority |

---

## Notification Settings

### `/notifications/settings`

| Setting | Options |
|---------|---------|
| Email notifications | On/Off per type |
| In-app notifications | On/Off per type |
| Email digest | None, Daily, Weekly |
| Quiet hours | Start/End time (no notifications during) |

---

## Toast Notifications (In-App)

| Event | Variant | Duration | Action |
|-------|---------|----------|--------|
| Reservation created | Success | 3s | "View" → navigate |
| Reservation cancelled | Info | 4s | "Undo" (if within window) |
| Action failed | Error | Manual | "Retry" |
| Guest checked in | Success | 3s | — |
| Table assigned | Success | 3s | — |
| Network error | Warning | Manual | "Dismiss" |

### Toast Position

| Screen | Position |
|--------|----------|
| Desktop | Top-right |
| Mobile | Top-center (full-width) |

### Toast Composition

```
┌──────────────────────────────────────┐
│ ✅ Reservation created successfully   │
│ Smith, John · 4 guests · 7:00 PM     │
│                              [View] ✕│
└──────────────────────────────────────┘
```

---

## Email Notification Templates

| Template | Trigger | Content |
|----------|---------|---------|
| Confirmation | Reservation created | Date, time, party size, confirmation code, restaurant info, map link |
| Reminder | 24h before | Reservation details, modify/cancel link |
| Modification | Reservation updated | Changed fields highlighted |
| Cancellation | Reservation cancelled | Confirmation of cancellation |
| No-show follow-up | After no-show | Polite message, link to rebook |
| Staff invitation | User invited | Set password link, organization name |

---

## Cross-References

- [component-library.md](./component-library.md) — Toast, badge components
- [interaction-design.md](./interaction-design.md) — Notification animations
- [responsive-design.md](./responsive-design.md) — Mobile notification behavior
