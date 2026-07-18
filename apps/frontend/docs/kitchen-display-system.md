# Kitchen Display System (KDS)

## Overview

The Kitchen Display System is an operational tool for restaurant kitchen staff to view, manage, and fulfill incoming orders. It is designed as a full-screen, real-time-updating application optimized for large touch displays in a kitchen environment.

## Architecture

```
src/
├── lib/
│   ├── order-types.ts           # Interfaces, constants, status maps, transitions, SLA config
│   └── order-schemas.ts         # Zod validation schemas for create/update
├── services/
│   └── kitchen.ts               # HTTP API layer (stats, tickets CRUD, stations)
├── hooks/
│   └── use-kitchen.ts           # React Query hooks with 10s polling
├── components/
│   └── kitchen/
│       ├── index.ts
│       ├── order-status-badge.tsx    # Large KDS badge + dot indicator
│       ├── preparation-timer.tsx     # Elapsed time + SLA progress bar
│       ├── order-card.tsx            # Complete order card with items, timer, actions
│       ├── order-board.tsx           # Board grouped by status columns
│       ├── station-selector.tsx      # Station filter tabs with workload badges
│       ├── station-view.tsx          # Single station filtered view
│       ├── kds-header.tsx            # Sticky header with stats + station selector
│       ├── kds-layout.tsx            # Full-screen layout (no admin chrome)
│       ├── kds-dashboard.tsx         # Composite dashboard composing all KDS components
│       └── __tests__/
│           ├── order-status-badge.test.tsx
│           ├── preparation-timer.test.tsx
│           ├── order-card.test.tsx
│           ├── order-board.test.tsx
│           ├── station-selector.test.tsx
│           ├── kds-header.test.tsx
│           └── kds-dashboard.test.tsx
└── app/(protected)/
    └── kitchen/
        └── page.tsx                  # KDS dashboard page (full-screen, no admin chrome)
```

## Order Lifecycle

```
┌─────┐    ┌──────────┐    ┌───────────┐    ┌───────┐    ┌───────────┐
│ New │ →  │ Accepted │ →  │ Preparing │ →  │ Ready │ →  │ Delivered │
└──┬──┘    └────┬─────┘    └─────┬─────┘    └───┬───┘    └───────────┘
   │            │                │               │
   └── Cancelled ┴── Cancelled ──┴── Cancelled ──┘
```

- **new** → accepted, cancelled
- **accepted** → preparing, cancelled
- **preparing** → ready, cancelled
- **ready** → delivered, cancelled
- **delivered**, **cancelled** → terminal states (no outgoing transitions)

## Station Model

Stations represent physical or logical preparation areas in the kitchen:

| Type | Icon | Description |
|------|------|-------------|
| `grill` | 🔥 | Grill station |
| `bar` | 🍸 | Bar / drink station |
| `dessert` | 🍰 | Dessert station |
| `cold` | ❄️ | Cold kitchen / salad station |
| `preparation` | 🔪 | General preparation |
| `custom` | ⚙️ | User-defined station type |

Each station has:
- `maxConcurrentTickets` — capacity limit
- `currentTickets` — current workload
- Workload percentage calculated as `currentTickets / maxConcurrentTickets`
- Visual indicator when workload exceeds 80%

## Priority & SLA

| Priority | Label | Color | SLA Limit |
|----------|-------|-------|-----------|
| `normal` | Normal | Blue | 10 min |
| `high` | High | Orange | 7 min 30 s |
| `urgent` | Urgent | Red | 5 min |
| `vip` | VIP | Purple | 3 min |
| `delayed` | Delayed | Rose | 5 min |

SLA status is determined by elapsed time vs. the limit:
- **on_track** (< 80% of limit) — blue clock
- **warning** (80–100% of limit) — amber, approaching limit
- **delayed** (≥ 100% of limit) — red with alert icon, pulse animation

## State Machine

```
                    ┌─────┐
                    │ New │
                    └──┬──┘
               ┌───────┼───────┐
               ▼       ▼       ▼
          ┌──────────┐ ┌────┐ ┌──────────┐
          │ Accepted │ │    │ │Cancelled │
          └─────┬────┘ │    │ └──────────┘
                │      │    │
                ▼      │    │
          ┌──────────┐ │    │
          │Preparing │ │    │
          └─────┬────┘ │    │
                │      │    │
                ▼      │    │
          ┌──────────┐ │    │
          │  Ready   │ │    │
          └─────┬────┘ │    │
                │      │    │
                ▼      ▼    ▼
          ┌──────────────┐
          │  Delivered   │
          │  Cancelled   │
          └──────────────┘
             Terminal
```

## Key Design Decisions

1. **Client-first architecture**: The backend has fully defined KitchenTicket, KitchenStation DTOs and application service layer, but no HTTP API endpoints yet. The frontend service layer is fully typed and structured to call backend endpoints when they exist, using the existing Axios/API infrastructure with JWT auth.

2. **KDS layout is separate from admin chrome**: The `kds-layout.tsx` component renders full-screen without the sidebar, top navigation, or `PageWrapper`. This is intentional — the KDS is an operational tool, not a management interface. It uses a dark background with large touch-friendly controls.

3. **Polling-based "real-time" updates**: Uses `refetchInterval: 10s` on TanStack Query hooks for live feel. Station list refreshes every 30 seconds (3x the ticket interval). Prepared for future WebSocket/SSE event subscription — `useEventSubscription` pattern is designed but not implemented since the backend doesn't have real-time infrastructure yet.

4. **Framer Motion animations**: Order cards use `AnimatePresence` with `layout` animations for smooth enter/exit/reorder when status transitions occur. SLA delay state triggers a pulse animation on the timer.

5. **Action-oriented order cards**: Each card shows available actions based on `TICKET_TRANSITIONS` map — only valid next statuses appear as buttons. Terminal states (delivered, cancelled) show no actions.

6. **SLA timers**: Count from `startedAt` if available, otherwise from `createdAt`. Timer stops when ticket reaches a terminal state. Updates every second while active using `setInterval`.

7. **Station filtering**: Client-side filter on `stationId`. The station selector shows workload badges with ticket counts. A compact mode reduces the board to only active status columns when a station is selected.

8. **Accessibility**: All interactive elements have ARIA labels, order cards use `role="article"`, the board uses `role="region"` with an accessible label, and status badges use `aria-label`. Color is not the only indicator of status — text labels are always visible.

## Future Real-Time Integration

When the backend provides WebSocket or SSE endpoints:

1. Create a `useEventSubscription(channel, eventHandler)` hook
2. Replace polling with event-driven updates
3. The service layer already supports this pattern — mutations invalidate query cache, and event subscriptions would push fresh data
4. Notification infrastructure for sound alerts (Web Audio API) on new orders

## API Endpoints (Planned)

All endpoints prefixed with `/api/v1/restaurants/:restaurantId/kitchen`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tickets` | List tickets (filter: `stationId`, `status`) |
| GET | `/tickets/:ticketId` | Get ticket by ID |
| POST | `/tickets` | Create ticket |
| PATCH | `/tickets/:ticketId/status` | Update ticket status |
| GET | `/stations` | List stations |
| GET | `/stations/:stationId` | Get station by ID |
| GET | `/stats` | Get kitchen dashboard stats |

## Current Status

- **Implemented**: All frontend components, hooks, services, types, tests
- **Not yet implemented**: Backend HTTP API, Prisma schema for orders/tickets, real-time infrastructure
- **Tests**: 62 tests across 7 test files covering all components
- **TypeScript**: Zero errors
- **Lint**: Zero warnings

## Responsive Behavior

- **Desktop / Large screens** (primary target): Full multi-column board, all features
- **Tablet**: Station selector remains usable, compact mode active
- **Touch**: All action buttons are large enough for touch targets
