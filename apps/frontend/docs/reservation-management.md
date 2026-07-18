# Reservation Management Module

## Overview

The Reservation Management module provides full CRUD operations, status transitions, calendar/timeline views, and search for restaurant reservations. It follows the same architecture as the Tables and Dining Areas modules.

## Architecture

```
src/
├── lib/
│   ├── reservation-types.ts    # Interfaces, constants, status maps, transitions
│   └── reservation-schemas.ts  # Zod validation schemas
├── services/
│   └── reservations.ts         # HTTP API layer
├── hooks/
│   ├── use-reservations.ts     # React Query hooks
│   └── __tests__/
│       └── use-reservations.test.tsx
├── components/
│   └── reservations/
│       ├── index.ts
│       ├── reservation-status-badge.tsx  # Status display (badge + dot)
│       ├── reservation-form.tsx           # Create/Edit form
│       ├── reservation-detail-view.tsx    # Detail view card
│       ├── reservation-actions.tsx        # Status transition dropdown
│       ├── reservation-calendar.tsx       # FullCalendar wrapper
│       ├── reservation-timeline.tsx       # Vertical timeline view
│       ├── reservation-search.tsx         # Search input
│       └── __tests__/
│           ├── reservation-status-badge.test.tsx
│           ├── reservation-form.test.tsx
│           ├── reservation-detail-view.test.tsx
│           ├── reservation-actions.test.tsx
│           ├── reservation-timeline.test.tsx
│           ├── reservation-search.test.tsx
│           └── reservation-schemas.test.tsx
└── app/(protected)/
    ├── reservations/
    │   └── page.tsx                     # Top-level placeholder (redirect)
    └── restaurants/[id]/reservations/
        ├── page.tsx                     # List page with table + filters
        ├── create/page.tsx              # Create reservation page
        ├── calendar/page.tsx            # Calendar + timeline views
        ├── [reservationId]/
        │   ├── page.tsx                 # Detail page
        │   └── edit/page.tsx            # Edit page
```

## API Endpoints

All endpoints are prefixed with `/api/v1/restaurants/:restaurantId/reservations`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List reservations (filters: `status`, `date`, `customerId`) |
| GET | `/:reservationId` | Get reservation by ID |
| POST | `/` | Create reservation |
| PUT | `/:reservationId` | Update reservation |
| PATCH | `/:reservationId/cancel` | Cancel reservation |
| PATCH | `/:reservationId/confirm` | Confirm reservation |
| PATCH | `/:reservationId/check-in` | Check in reservation |
| PATCH | `/:reservationId/complete` | Complete reservation |

## Reservation Statuses

| Status | Label | Variant | Terminal |
|--------|-------|---------|----------|
| `pending` | Pending | warning | No |
| `confirmed` | Confirmed | info | No |
| `checked_in` | Checked In | info | No |
| `seated` | Seated | info | No |
| `completed` | Completed | success | Yes |
| `cancelled` | Cancelled | secondary | Yes |
| `no_show` | No Show | danger | Yes |

## State Transitions

- **pending** → confirmed, cancelled, no_show
- **confirmed** → cancelled, no_show, checked_in, completed
- **checked_in** → cancelled, seated
- **seated** → no_show, completed
- **completed**, **cancelled**, **no_show** → (terminal, no outgoing transitions)

## Key Design Decisions

1. **No dedicated search/calendar endpoints exist on the backend.** The search is implemented client-side as a filter on the list endpoint. Calendar views use FullCalendar's client-side rendering with data from the list endpoint.

2. **`FullCalendar`** provides the calendar rendering with Day, Week, Month, Timeline, and Agenda views. The `@fullcalendar/interaction` plugin enables date selection and event click.

3. **Vertical Timeline** is a custom implementation for the timeline view, rendering reservation blocks positioned by time against hour grid lines.

4. **Status transitions** are handled by separate mutation hooks (`useCancelReservation`, `useConfirmReservation`, etc.) rather than a single generic mutation, matching the backend route structure.

5. **Optimistic updates** are not used for status transitions since the backend returns the updated DTO. Cache invalidation refreshes the list and detail queries.

6. **The `reservationNumber` field** maps to the backend's `confirmationCode` in the Prisma schema.

## State Machine

```
                  ┌─────────┐
                  │ Pending │
                  └────┬────┘
              ┌────────┼────────┐
              ▼        ▼        ▼
         ┌─────────┐ ┌────┐ ┌───────┐
         │Confirmed│ │    │ │No Show│
         └────┬────┘ │    │ └───────┘
       ┌──────┼───┐   │    │
       ▼      ▼   ▼   │    │
   ┌────┐ ┌────┐ ┌──┐ │    │
   │    │ │    │ │  │ │    │
   │Chk │ │Cmp │ │  │ │    │
   │In  │ │let.│ │  │ │    │
   └──┬─┘ └────┘ │  │ │    │
      ▼          │  │ │    │
   ┌────┐        │  │ │    │
   │Seat│        │  │ │    │
   └──┬─┘        │  │ │    │
      ▼          ▼  ▼ ▼    ▼
   ┌──────────────┐
   │  Completed   │
   │  Cancelled   │
   │  No Show     │
   └──────────────┘
        Terminal
```

## Views

### Day View
FullCalendar `timeGridDay` — shows a single day with time slots from 8 AM to 11 PM. Reservations appear as colored blocks positioned by start/end time.

### Week View
FullCalendar `timeGridWeek` — shows 7 days in a scrollable grid with time slots.

### Month View
FullCalendar `dayGridMonth` — shows a traditional month grid. Reservations appear as dots/badges on dates (limited to 3 per day with a "+more" link).

### Timeline View
Custom vertical timeline — shows a single day with reservation blocks positioned by time. Hour grid lines with current time indicator. Compact card per reservation with number, party size, and time range.

### Agenda View
FullCalendar `listWeek` — shows reservations in a scrollable list grouped by date.

## Quick Actions

Dropdown mechanism that dynamically shows allowed status transitions based on the current status and the `ALLOWED_TRANSITIONS` configuration map. Each action opens a confirmation dialog before executing.

Actions include:
- **Confirm** (pending → confirmed)
- **Cancel** (pending, confirmed, checked_in → cancelled)
- **Check In** (confirmed → checked_in)
- **Complete** (confirmed, seated → completed)
- **Edit** (navigates to edit page)

## Accessibility

- All interactive elements have ARIA labels
- Status badges use `aria-label` for screen readers
- Calendar has a status legend with accessible labels
- Timeline blocks are `button` elements with descriptive `aria-label`
- Search is wrapped in a `<form role="search">`
- Tables use proper `aria-sort` attributes on sortable headers
- Form fields use `aria-invalid` and `aria-describedby` for error states
- Loading states use `Skeleton` components with `aria-busy`

## Responsive Behavior

- **Desktop**: Full calendar with all views, detail view, edit form
- **Tablet**: Limited editing via dropdown actions, calendar still functional
- **Mobile**: View-only mode with condensed timeline; creation/editing navigates to dedicated page
