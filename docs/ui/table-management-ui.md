# Table Management UI

**Last updated:** 2026-07-04

## Overview

Table management provides a visual floor plan of the restaurant. Staff use it for drag-and-drop table assignment, status changes, and real-time occupancy monitoring.

---

## Floor Plan View

### Layout

```
+------------------------------------------------------------------+
| Floor Plan              [Edit Layout] [Add Table] [Zoom: 100% ▼] |
+------------------------------------------------------------------+
|                                                                   |
|   Legend:                                                         |
|   🟢 Available    🔴 Occupied    🔵 Reserved    🟡 Pending       |
|   🟣 Cleaning     ⚪ Blocked      🟠 Walk-in                      |
|                                                                   |
|        ═══════════════════ ENTRANCE ═══════════════════           |
|                                                                   |
|   ┌──────────┐                ┌──────────┐                       |
|   │  T-12    │                │  T-14    │    Window             |
|   │  4 pax   │                │  2 pax   │    ═════════          |
|   │  🟢     │                │  🔴     │                       |
|   │  ─────  │                │  ─────  │                       |
|   │  Window │                │  Smith  │                       |
|   └──────────┘                └──────────┘                       |
|                                                                   |
|   ┌──────────┐  ┌──────────┐  ┌──────────┐                       |
|   │  T-10    │  │  T-11    │  │  T-13    │    BAR               |
|   │  6 pax   │  │  4 pax   │  │  8 pax   │    ═════════════      |
|   │  🔴     │  │  🔵     │  │  🟢     │                       |
|   │  ─────  │  │  ─────  │  │  ─────  │                       |
|   │  Jones  │  │  ➕ Lee  │  │         │                       |
|   └──────────┘  └──────────┘  └──────────┘                       |
|                                                                   |
|   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        |
|   │  T-8     │  │  T-9     │  │  T-15    │  │  T-16    │        |
|   │  2 pax   │  │  4 pax   │  │  4 pax   │  │  2 pax   │        |
|   │  🟣     │  │  🟡     │  │  🟢     │  │  ⚪     │        |
|   │  ─────  │  │  ─────  │  │  ─────  │  │  ─────  │        |
|   │  Cleaning│  │  Pend.   │  │         │  │  Blocked │        |
|   └──────────┘  └──────────┘  └──────────┘  └──────────┘        |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Table Card (on Floor Plan)

### Default View

```
┌──────────────┐
│  T-12        │ ← Table number
│  4 pax       │ ← Capacity
│  🟢          │ ← Status indicator (large dot, color-coded)
│  ─────       │
│  Window      │ ← Features/attributes
└──────────────┘
```

### Occupied Detail (hover/click)

```
┌──────────────┐
│  T-14     🔴 │
│  2 pax       │
│  ─────       │
│  Smith       │ ← Current guest name
│  7:00 PM     │ ← Seated at
│  45 min      │ ← Duration seated
└──────────────┘
```

---

## Interactive Behaviors

| Interaction | Behavior |
|-------------|----------|
| **Hover table** | Elevate card, show table detail tooltip |
| **Click table** | Open detail panel (slide-out right) with reservation info + actions |
| **Double-click** | Quick check-in (if table is available + has pending reservation) |
| **Drag reservation** | Drag from reservation list onto table → assign table (visual feedback) |
| **Drag table** | (Edit mode) Move table position on canvas |
| **Right-click table** | Context menu: Mark as cleaning, Block table, View history |
| **Shift+click** | Multi-select tables for batch operations |

### Drag-and-Drop: Reservation to Table

```
1. User starts dragging a reservation row (drag handle or long-press)
2. Draggable shows: guest name + party size
3. Drop zone: any available/suggested table highlights in green
4. Invalid drop: grayed out table, no highlight
5. On drop: 
   - Brief success animation (green flash)
   - Table status updates to 🔵 Reserved
   - Reservation status updates to Confirmed
   - Toast: "T-12 assigned to Smith"
6. On miss (drop outside any table): no action, snap back with subtle shake
```

### Right-Click Context Menu

| Option | Action | Permission |
|--------|--------|------------|
| Check In | Mark guest seated | `reservations.checkin` |
| Mark Cleaning | Set status to cleaning | `tables.update` |
| Block Table | Set status to blocked (with reason) | `tables.update` |
| View Details | Open table detail panel | `tables.read` |
| History | Show table usage history | `tables.read` |

---

## Zone Management

| Zone | Color | Purpose |
|------|-------|---------|
| Main Hall | Default (no tint) | Standard dining |
| Window | Blue border | Window-side tables |
| Patio | Green border | Outdoor seating |
| Bar | Amber border | Bar counter seating |
| VIP | Purple border | VIP section |
| Private Room | Gold border | Private dining |

- Zones shown as colored outlines or background tints on floor plan
- Filter by zone: toggle zones on/off in legend
- Zone management: CRUD modal from settings

---

## Table CRUD

### Create/Edit Table Modal

| Field | Type | Validation |
|-------|------|------------|
| Table number | Text | Required, unique per branch |
| Capacity (min) | Number | ≥ 1, ≤ max |
| Capacity (max) | Number | ≥ min, ≤ branch max |
| Zone | Select | Optional, from zone list |
| Features | Multi-select | Window, High-top, Booth, Accessible, VIP |
| Position X | Number (auto) | Set by drag on canvas |
| Position Y | Number (auto) | Set by drag on canvas |
| Status | Select | Available, Blocked (default: Available) |

### Delete Table

- Confirmation modal: "Delete T-12? This cannot be undone."
- Cannot delete table with active reservations
- Show warning if table has future reservations

---

## Floor Plan Canvas Controls

| Control | Behavior |
|---------|----------|
| Zoom | 50%–200% slider or ± buttons |
| Pan | Click + drag on empty canvas space |
| Snap to grid | Tables snap to 20px grid (configurable) |
| Auto-layout | Arrange tables in grid (for quick setup) |
| Background | Show room dimensions (optional) |
| Print | Print floor plan to PDF |

---

## Table Status Change Confirmation

| Status Change | Confirmation Needed |
|---------------|-------------------|
| Available → Reserved | No (automatic on reservation) |
| Available → Blocked | No (admin action) |
| Occupied → Available | Yes: "Mark table as available?" (double-check cleaning) |
| Cleaning → Available | No (automatic on timer or manual) |
| Reserved → Occupied | No (check-in action) |

---

## Mobile Floor Plan

| Adaptation | Detail |
|------------|--------|
| Pinch to zoom | Native gesture |
| Single tap = click | No hover state |
| Long press = right-click | Context menu appears |
| Swipe to pan | One-finger pan on canvas |
| Table cards larger | Minimum touch target 44px |
| Simplified view | Hide zone colors, show only status dots |

## Cross-References

- [wireframes.md](./wireframes.md) — Floor plan wireframe
- [interaction-design.md](./interaction-design.md) — Drag-and-drop interactions
- [responsive-design.md](./responsive-design.md) — Mobile table management
