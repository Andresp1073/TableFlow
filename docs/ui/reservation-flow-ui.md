# Reservation Flow UI

**Last updated:** 2026-07-04

## Overview

The reservation creation flow is the most critical UX path. It must be fast (staff < 15s), error-proof, and accessible to all roles.

---

## Flow States

### 1. Quick Create (Staff) — Single Modal

```
Step 1: Guest     Step 2: Details    Step 3: Table      Step 4: Confirm
┌─────────────┐  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Search/Add  │→ │ Party Size   │→  │ Available    │→  │ Review +     │
│ Customer    │  │ Date & Time  │   │ Tables Grid  │   │ Confirm      │
│             │  │ Special Req  │   │ (auto-select)│   │ Success ✅   │
└─────────────┘  └──────────────┘   └──────────────┘   └──────────────┘
```

### 2. Customer Self-Service (Web Widget)

```
Step 1: Search      Step 2: Time      Step 3: Info       Step 4: Done
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Party + Date │→  │ Available    │→  │ Name, Email  │→  │ Confirmation │
│ Select       │   │ Time Slots   │   │ Phone, Notes │   │ Code + Email │
│              │   │              │   │              │   │              │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

---

## Step-by-Step UX Design

### Step 1: Guest Selection (Staff Only)

| Element | Detail |
|---------|--------|
| **Search field** | Auto-focus on open, type-ahead search by name, email, phone |
| **Results** | Show name, phone, total visits, last visit date |
| **No results** | "Create new customer" option with pre-filled fields |
| **Quick add** | Name + phone only (minimal), expandable for full form |
| **Returning guest** | Show past preferences (allergies, table preference badge) |

### Step 2: Reservation Details

| Fields | Validation | Behavior |
|--------|------------|----------|
| **Party size** | 1–max party size | Dropdown or number stepper |
| **Date** | Not in past, within booking window | Date picker with quick-select: Today, Tomorrow |
| **Time** | Within operating hours, available slots | Time slot picker (15 min intervals), show available/limited |
| **Duration** | Default from settings, editable | Auto-set to branch default dine duration |
| **Special requests** | 500 char max | Textarea, optional |
| **Walk-in toggle** | — | Marks reservation as walk-in |

### Step 3: Table Selection

| Mode | Behavior |
|------|----------|
| **Auto-assign** | Default. System suggests best table. Shows table name. |
| **Manual select** | Click to open floor plan mini-view, tap table to select |
| **No tables** | Show warning: "No tables available for this party size at this time" |
| **Split party** | Option to split across adjacent tables (show suggestion) |

### Table Suggestion Logic (UI)

- Highlight recommended table(s) in green
- Show nearby available tables
- Gray out unavailable tables
- Show table capacity + features (window, high-top, accessible)

### Step 4: Confirmation

| Element | Detail |
|---------|--------|
| **Summary card** | Guest name, party size, date, time, table, duration |
| **Actions** | Confirm, Edit, Cancel |
| **Success state** | Toast "Reservation created" + auto-close modal |
| **Failure state** | Error message with specific reason (table already taken, time passed) |
| **Double-booking prevention** | Server-side validation; if race condition detected, show "Table was just taken. Please select another." with fresh table options. |

---

## Reservation Status Visual Design

| Status | Color | Icon | Badge Style |
|--------|-------|------|-------------|
| Pending | Amber | ⏳ | `warning` outline badge |
| Confirmed | Blue | ✅ | `primary` solid badge |
| Seated | Green | 🟢 | `success` solid badge |
| Completed | Gray | ✓ | `neutral` outline badge |
| Cancelled | Red | ❌ | `error` solid badge (strikethrough text) |
| No-show | Red | 🚫 | `error` solid badge (bold) |

---

## Reservation Detail Panel

Clicking a reservation in the list opens a **slide-out detail panel** (right side, 400px).

### Panel Sections

```
┌──────────────────────────────────┐
│ Reservation #R-2026-07-04-0042  │
│ [Edit] [Cancel] [Check-in]      │ ← Action buttons
├──────────────────────────────────┤
│ Guest                            │
│ John Smith                       │
│ john@email.com · (555) 123-4567 │
│ Total visits: 12                 │
├──────────────────────────────────┤
│ Details                          │
│ Party: 4 guests                  │
│ Date: Jul 4, 2026                │
│ Time: 7:00 PM                    │
│ Duration: 90 min                 │
│ Table: T-12 (Window)            │
│ Status: ✅ Confirmed            │
├──────────────────────────────────┤
│ Special Requests                 │
│ "Allergic to nuts. Prefers      │
│  window table."                  │
├──────────────────────────────────┤
│ Timeline                         │
│ Created: 2h ago by Jane         │
│ Modified: —                     │
│ Checked in: —                   │
└──────────────────────────────────┘
```

---

## Calendar View (Alternative)

### Layout

- Month grid with day cells
- Each day shows: total reservations count, occupancy % indicator
- Click day → Day view with time-slot rows
- Drag to select time range
- Color density indicates busyness (green=low, amber=medium, red=high)

---

## Availability Checker UI

| Element | Detail |
|---------|--------|
| **Inputs** | Date, party size, time range (optional) |
| **Results** | Grid or list of available time slots + suggested tables |
| **Visual** | Time slots: green (available), amber (limited), gray (full) |
| **Quick actions** | Select slot → auto-navigate to create reservation |

---

## Multi-Step Indicator

```
Step 1  ──────  Step 2  ──────  Step 3  ──────  Step 4
  ●         ──→   ○         ──→   ○         ──→   ○
 Done            Current          Pending          Pending
```

- Completed steps: green circle with checkmark
- Current step: blue filled circle
- Pending steps: gray outlined circle
- Clickable completed steps to go back

---

## Edge Cases

| Scenario | UI Behavior |
|----------|-------------|
| Party too large for single table | Suggest split tables, or show "max party size" message |
| Time outside operating hours | Disable time slots, show restaurant hours below picker |
| Double-booking detected | Alert with "Table was just taken" + suggest alternatives |
| Customer has active no-show flag | Warning alert: "This guest has 3 no-shows. Require confirmation?" |
| Branch at capacity | Show "Restaurant is fully booked" with waitlist option |
| Reservation in past | Prevent selection, gray out date |

## Cross-References

- [user-journeys.md](./user-journeys.md) — Customer and receptionist journeys
- [forms-and-validation-ui.md](./forms-and-validation-ui.md) — Form validation patterns
- [interaction-design.md](./interaction-design.md) — Multi-step transitions
- [responsive-design.md](./responsive-design.md) — Mobile reservation UX
