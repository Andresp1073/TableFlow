# Dining Areas Module

## Architecture

The Dining Areas frontend module follows the same architecture as other CRUD modules (Orders, Reservations):

```
lib/dining-area-types.ts       — TypeScript interfaces and constants
lib/dining-area-schemas.ts     — Zod validation schemas
services/dining-areas.ts       — API service layer (list, get, create, update, archive)
hooks/use-dining-areas.ts      — TanStack Query hooks
components/dining-areas/       — Reusable UI components
app/(protected)/dining-areas/  — Top-level pages
app/(protected)/restaurants/[id]/dining-areas/ — Restaurant-scoped pages
```

## Routing

| Route | Type | Description |
|-------|------|-------------|
| `/dining-areas` | Static | List all dining areas for the selected restaurant |
| `/dining-areas/create` | Static | Create a new dining area |
| `/dining-areas/[diningAreaId]` | Dynamic | View dining area details |
| `/dining-areas/[diningAreaId]/edit` | Dynamic | Edit dining area |
| `/restaurants/[id]/dining-areas` | Dynamic | Restaurant-scoped list |
| `/restaurants/[id]/dining-areas/create` | Dynamic | Restaurant-scoped create |
| `/restaurants/[id]/dining-areas/[diningAreaId]` | Dynamic | Restaurant-scoped detail |
| `/restaurants/[id]/dining-areas/[diningAreaId]/edit` | Dynamic | Restaurant-scoped edit |

Top-level pages use `useRestaurant()` context to get the active restaurant ID.
Restaurant-scoped pages use `useParams()` to get `id` from the URL.

## Permissions

| Permission | Description |
|------------|-------------|
| `restaurants.dining-areas.read` | View dining areas list and details |
| `restaurants.dining-areas.create` | Create dining areas |
| `restaurants.dining-areas.update` | Update dining areas |
| `restaurants.dining-areas.archive` | Archive dining areas |

Permissions are enforced by the backend API. The frontend respects authorization by
hiding or disabling actions the user cannot perform.

## API Integration

Base URL: `/api/v1/restaurants/{restaurantId}/dining-areas`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List dining areas (optional `?status=active\|archived`) |
| GET | `/:diningAreaId` | Get single dining area |
| POST | `/` | Create dining area |
| PUT | `/:diningAreaId` | Update dining area |
| PATCH | `/:diningAreaId/archive` | Archive dining area |

## Data Flow

1. **Types** (`lib/dining-area-types.ts`) define `DiningArea`, `DiningAreaStatus`, `DiningAreaCreateInput`, `DiningAreaUpdateInput`, `DiningAreaListParams`
2. **Schemas** (`lib/dining-area-schemas.ts`) define Zod validation for create and update forms
3. **Service** (`services/dining-areas.ts`) wraps API calls using the shared API client
4. **Hooks** (`hooks/use-dining-areas.ts`) provide React Query wrappers with automatic cache invalidation
5. **Components** (`components/dining-areas/`) provide reusable UI:
   - `DiningAreaForm` — Create/edit form with React Hook Form + Zod
   - `DiningAreaDetailView` — Read-only detail display
   - `DiningAreaActions` — Action buttons (edit, archive) with confirmation dialogs
   - `DiningAreaStatusBadge` — Status indicator badge
6. **Pages** compose components with `PageWrapper` for consistent layout

## User Flows

### List → Detail
1. User navigates to `/dining-areas`
2. Page fetches areas via `useDiningAreas(restaurantId, { status? })`
3. TanStack Table renders with sorting, search, and status filter
4. Clicking a row navigates to `/dining-areas/{id}`

### Create
1. User clicks "New Area" on list page
2. `DiningAreaForm` validates input with Zod
3. Submit calls `useCreateDiningArea()` mutation
4. On success, navigates to the new area's detail page

### Edit
1. From detail page, user clicks "Edit" button
2. Page fetches existing area via `useDiningArea(restaurantId, diningAreaId)`
3. Form pre-populates with existing data
4. Submit calls `useUpdateDiningArea()` mutation
5. On success, navigates back to detail page

### Archive
1. From detail page, user opens actions dropdown and selects "Archive"
2. Confirmation dialog appears
3. Confirm calls `useArchiveDiningArea()` mutation
4. On success, page refreshes showing archived status

## Components

### DiningAreaForm
- Props: `mode`, `initialData?`, `isLoading?`, `error?`, `onSubmit`
- Uses `react-hook-form` with `zodResolver`
- Fields: Name (required), Code (required, uppercase regex), Description, Display Order, isReservable checkbox

### DiningAreaDetailView
- Props: `area: DiningArea`
- Displays area name, code, description, display order, isReservable, restaurant ID
- Shows audit information (ID, createdAt, updatedAt)

### DiningAreaActions
- Props: `area: DiningArea`, `restaurantId?: string`
- If `restaurantId` prop omitted, falls back to `useParams()` for restaurant-scoped pages
- Shows Edit button and dropdown with Archive action
- Archive action shows confirmation dialog

### DiningAreaStatusBadge
- Props: `status: DiningAreaStatus`
- Renders `active` as success badge, `archived` as default badge

## State Handling

All pages handle:
- **Loading**: Skeleton placeholders matching content layout
- **Empty**: Descriptive message with fallback action link
- **Error**: Alert with error message from API
- **No restaurant**: Message to select a restaurant (context-based pages only)

## Tests

Test files are located at `src/app/(protected)/dining-areas/__tests__/`:

| File | Tests | Description |
|------|-------|-------------|
| `page.test.tsx` | 10 | List page: rendering, search, filters, empty, error states |
| `create-page.test.tsx` | 7 | Create page: title, form fields, buttons |
| `detail-page.test.tsx` | 7 | Detail page: data display, actions, audit info |
| `edit-page.test.tsx` | 4 | Edit page: title, form, save button |

Existing component tests at `src/components/dining-areas/__tests__/`:
- `dining-area-detail-view.test.tsx`
- `dining-area-actions.test.tsx`
- `dining-area-form.test.tsx`
- `dining-area-status-badge.test.tsx`
