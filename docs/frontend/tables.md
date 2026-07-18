# Tables Module

## Architecture

The Tables frontend module follows the same architecture as other CRUD modules (Dining Areas, Reservations):

```
lib/table-types.ts               — TypeScript interfaces and constants
lib/table-schemas.ts             — Zod validation schemas
services/tables.ts               — API service layer (list, get, create, update, archive, status)
hooks/use-tables.ts              — TanStack Query hooks
components/tables/               — Reusable UI components
app/(protected)/tables/          — Top-level pages
```

## Routing

| Route | Type | Description |
|-------|------|-------------|
| `/tables` | Static | List all tables for the selected restaurant |
| `/tables/create` | Static | Create a new table |
| `/tables/[tableId]` | Dynamic | View table details |
| `/tables/[tableId]/edit` | Dynamic | Edit table |

Top-level pages use `useRestaurant()` context to get the active restaurant ID.

## Permissions

| Permission | Description |
|------------|-------------|
| `restaurants.tables.read` | View tables list and details |
| `restaurants.tables.create` | Create tables |
| `restaurants.tables.update` | Update tables |
| `restaurants.tables.archive` | Archive tables |
| `restaurants.tables.restore` | Restore tables |
| `restaurants.tables.status` | Change table status |

Permissions are enforced by the backend API. The frontend respects authorization by
hiding or disabling actions the user cannot perform.

## API Integration

Base URL: `/api/v1/restaurants/{restaurantId}/tables`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List tables with optional filters (`?status=`, `?diningAreaId=`, `?minCapacity=`) |
| GET | `/:tableId` | Get single table |
| POST | `/` | Create table |
| PUT | `/:tableId` | Update table |
| PATCH | `/:tableId/archive` | Archive table (soft-delete) |
| PATCH | `/:tableId/status` | Change table status with transition validation |
| GET | `/:tableId/transitions` | Get allowed status transitions |

## Data Flow

1. **Types** (`lib/table-types.ts`) define `RestaurantTable`, `TableStatus`, `TableShape`, `TableCreateInput`, `TableUpdateInput`, `TableListParams`
2. **Schemas** (`lib/table-schemas.ts`) define Zod validation for create/update forms and status changes
3. **Service** (`services/tables.ts`) wraps API calls using the shared API client
4. **Hooks** (`hooks/use-tables.ts`) provide React Query wrappers with automatic cache invalidation
5. **Components** (`components/tables/`) provide reusable UI:
   - `TableForm` — Create/edit form with React Hook Form + Zod
   - `TableDetailView` — Read-only detail display with cards
   - `TableActions` — Action buttons (edit, change status, archive) with confirmation dialogs
   - `TableStatusBadge` — Colored status badge
   - `TableAvailabilityBadge` — Availability indicator
   - `TableCard` — Compact card view for floor plans
6. **Pages** compose components with `PageWrapper` for consistent layout

## User Flows

### List → Detail
1. User navigates to `/tables`
2. Page fetches tables via `useTables(restaurantId, { status? })`
3. TanStack Table renders with sorting, search, and status filter
4. Clicking a row navigates to `/tables/{id}`

### Create
1. User clicks "New Table" on list page
2. `TableForm` validates input with Zod (table number regex, capacity range)
3. Submit calls `useCreateTable()` mutation
4. On success, navigates to the new table's detail page

### Edit
1. From detail page, user clicks "Edit" button
2. Page fetches existing table via `useTable(restaurantId, tableId)`
3. Form pre-populates with existing data
4. Submit calls `useUpdateTable()` mutation
5. On success, navigates back to detail page

### Change Status
1. From detail page, user clicks "Change Status" button
2. Dialog shows allowed transitions for current status
3. User selects new status and confirms
4. Calls `useChangeTableStatus()` mutation
5. On success, page refreshes showing new status

### Archive
1. From detail page, user opens actions dropdown and selects "Archive"
2. Confirmation dialog appears
3. Confirm calls `useArchiveTable()` mutation
4. On success, page refreshes showing archived status

## Components

### TableForm
- Props: `mode`, `initialData?`, `diningAreaId?`, `branchId?`, `isLoading?`, `error?`, `onSubmit`
- Uses `react-hook-form` with `zodResolver`
- Fields: Table Number (required, alphanumeric), Name, Description, Shape (select), Min/Max Capacity, Width/Height, isReservable checkbox, isAccessible checkbox

### TableDetailView
- Props: `table: RestaurantTable`
- Displays four card sections: Table Information, Capacity & Status, Position & Dimensions, Audit Information
- Shows status with colored dot indicator and badge

### TableActions
- Props: `table: RestaurantTable`, `restaurantId?: string`, `allowedTransitions?`, `showViewOnFloorPlan?`, `onViewOnFloorPlan?`
- If `restaurantId` prop omitted, falls back to `useParams()` for restaurant-scoped pages
- Shows Edit button, Change Status button, and actions dropdown with Archive
- Change Status dialog shows only valid transitions
- Archive action shows confirmation dialog

### TableStatusBadge
- Props: `status: TableStatus`
- Renders with semantic color variants: available (green), occupied (red), reserved (amber), cleaning (blue), etc.

## State Handling

All pages handle:
- **Loading**: Skeleton placeholders matching content layout
- **Empty**: Descriptive message with fallback action link
- **Error**: Alert with error message from API
- **No restaurant**: Message to select a restaurant (context-based pages only)

## Tests

Test files are located at `src/app/(protected)/tables/__tests__/`:

| File | Tests | Description |
|------|-------|-------------|
| `page.test.tsx` | 10 | List page: rendering, search, filters, empty, error states |
| `create-page.test.tsx` | 7 | Create page: title, form fields, buttons |
| `detail-page.test.tsx` | 9 | Detail page: data display, cards, actions, audit info |
| `edit-page.test.tsx` | 4 | Edit page: title, form, save button |

Existing component tests at `src/components/tables/__tests__/`:
- `table-form.test.tsx`
- `table-detail-view.test.tsx`
- `table-actions.test.tsx`
- `table-status-badge.test.tsx`
- `table-availability-badge.test.tsx`
- `table-card.test.tsx`
