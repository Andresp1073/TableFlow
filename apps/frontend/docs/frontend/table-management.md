# Table Management Module & Interactive Floor Plan

## Architecture

```
src/
├── lib/
│   ├── table-types.ts          # TypeScript interfaces, enums, constants
│   └── table-schemas.ts        # Zod validation schemas
├── services/
│   └── tables.ts               # API service layer
├── hooks/
│   └── use-tables.ts           # React Query hooks (8 hooks)
├── components/tables/
│   ├── table-status-badge.tsx  # Status badge + small variant
│   ├── table-card.tsx          # Floor plan draggable card (SVG)
│   ├── floor-plan-canvas.tsx   # Interactive floor plan editor
│   ├── table-form.tsx          # Create/edit form (RHF + Zod)
│   ├── table-detail-view.tsx   # Detail view with cards
│   ├── table-actions.tsx       # Action bar (edit, status, archive)
│   └── __tests__/              # Component tests
└── app/(protected)/restaurants/[id]/tables/
    ├── page.tsx                # Table list (client-filtered)
    ├── create/page.tsx         # Create table
    ├── [tableId]/page.tsx      # Table detail
    ├── [tableId]/edit/page.tsx # Edit table
    └── floor-plan/page.tsx     # Floor plan editor
```

### Data Flow

```
Pages → React Query Hooks → API Service Layer → Axios (with refresh interceptor) → Backend
         ↓
   TanStack Query Cache (optimistic updates, invalidation)
         ↓
   Components re-render
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/restaurants/:id/tables` | List tables (filters) |
| GET | `/restaurants/:id/tables/:tableId` | Get single table |
| POST | `/restaurants/:id/tables` | Create table |
| PUT | `/restaurants/:id/tables/:tableId` | Update table |
| PATCH | `/restaurants/:id/tables/:tableId/archive` | Archive table |
| PATCH | `/restaurants/:id/tables/:tableId/status` | Change status |
| GET | `/restaurants/:id/tables/:tableId/transitions` | Allowed status transitions |

### Types

- **RestaurantTable**: Full table DTO (20+ fields including position, dimensions, capacity)
- **TableCreateInput / TableUpdateInput**: Mutation input types
- **TableStatus**: `available | occupied | reserved | cleaning | out_of_service | blocked | maintenance | archived`
- **TableShape**: `square | rectangle | round | oval | custom`

## Floor Plan

### Canvas Features

- **Drag & Drop**: Tables positioned via SVG with pointer-event-based drag (grid-snapped to 10px)
- **Zoom**: Scroll-wheel zoom (25%–300%), Zoom In/Out buttons, percentage display
- **Pan**: Pan mode (H) or drag empty canvas; cursor changes appropriately
- **Grid Snapping**: 20px grid with major lines every 100px; toggle with G key or button
- **Selection**: Click to select, click again to deselect; keyboard Enter/Space support
- **Fit to Screen**: Auto-calculates zoom/pan to show all tables; F key shortcut
- **Reset View**: Returns to default zoom/position; R key shortcut

### Toolbar

| Tool | Shortcut | Description |
|------|----------|-------------|
| Select mode | V | Click to select tables |
| Pan mode | H | Drag to pan canvas |
| Toggle Grid | G | Show/hide grid overlay |
| Zoom In | | Zoom in 10% |
| Zoom Out | | Zoom out 10% |
| Fit | F | Fit all tables to view |
| Reset | R | Reset zoom and position |

### Table Card (SVG)

- **Shape rendering**: circle (round), ellipse (oval), rounded rect (square/rectangle)
- **Color coding**: Status-based fill/stroke (green=available, red=occupied, etc.)
- **Label**: Table number + capacity (e.g., "T01" "2-4")
- **Name**: Optional name below table
- **Visual indicator**: Top-center notch on rectangle/square shapes
- **Selected state**: Highlighted stroke + semi-transparent fill
- **Capacity display**: Single number if min==max, range otherwise

## Interactions

### Drag & Drop

1. Pointer down on table → `setPointerCapture` + store start position
2. Pointer move → Calculate delta, apply grid snap (10px), call `onDragMove`
3. Pointer up → Call `onDragEnd` with final snapped position
4. Optimistic update via TanStack Query `onMutate` → revert on error

### Status Change

- Dedicated "Change Status" dialog with allowed transitions
- Backend provides allowed transitions via `/transitions` endpoint
- Fallback to default transition map if endpoint unavailable

### Archive

- Confirmation dialog (reuses `ConfirmActionDialog` from restaurant module)
- PATCH to `/archive` endpoint
- Archived tables rendered as read-only on floor plan

## Permissions

- UI hides Change Status and Archive buttons for archived/inactive tables
- Backend enforces `tables.*` permissions at the API level
- Read-only mode for floor plan canvas via `readOnly` prop

## React Query Hooks

| Hook | Description |
|------|-------------|
| `useTables` | List tables with filters (30s stale time) |
| `useTable` | Single table by ID |
| `useCreateTable` | Create mutation + invalidation |
| `useUpdateTable` | Update mutation + invalidation |
| `useUpdateTablePosition` | Position update with optimistic cache update |
| `useArchiveTable` | Archive mutation + invalidation |
| `useChangeTableStatus` | Status change mutation + invalidation |
| `useTableTransitions` | Allowed status transitions (60s stale time) |

## Tests

```
34 test files | 248 tests (all passing)
```

### Coverage

- **FloorPlanCanvas**: Toolbar rendering, zoom controls, table selection/deselection, grid toggle, empty/loading states, dining area name, inactive tables
- **TableCard**: Number, capacity, name, ARIA labels, selected state, shapes (round/oval/square/rectangle), keyboard selection, null name
- **TableForm**: Create mode defaults, edit mode pre-fill, validation errors, submit, error display, disabled loading state, shape select, capacity fields, checkboxes
- **TableDetailView**: Table number/name, status, capacity range, position, dimensions, reservable/accessible, description, audit info, shape label, null position, single capacity
- **TableActions**: Edit/actions buttons, status change dialog, archive dialog, floor plan button, restore disabled, view callback
- **TableStatusBadge**: All 8 statuses, small variant with accessibility labels
- **useTables hooks**: Fetch list/single, create/update/archive/status-change/position-update mutations
- **Schemas**: Validation, rejection, coercion, partial updates
- **Types**: Constants, colors, options

## Key Design Decisions

1. **Why not @dnd-kit?**: Pointer events + CSS transforms provide sufficient control without adding a dependency; framer-motion available for future animation enhancements
2. **Why optimistic updates for positions?**: Floor plan drag requires immediate visual feedback; API errors can revert via `onError` handler
3. **Why client-side filtering for table list?**: Backend returns full list (no pagination for tables); client-side search/filter is simpler
4. **Why SVG for table shapes?**: More flexible than pure CSS shapes; supports rotation, different geometries, and future resize handles
