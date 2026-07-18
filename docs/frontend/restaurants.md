# Restaurant Management Module

## Overview
The Restaurant Management module provides full CRUD + status management for restaurants within the TableFlow platform. It follows the same patterns as the dashboard and auth modules.

## Architecture

### Directory Structure
```
src/
├── lib/
│   ├── restaurant-types.ts      # TypeScript interfaces & constants
│   └── restaurant-schemas.ts    # Zod validation schemas
├── services/
│   └── restaurants.ts           # API service layer
├── hooks/
│   ├── use-restaurants.ts       # React Query hooks
│   └── __tests__/
│       └── use-restaurants.test.tsx
├── components/
│   └── restaurants/
│       ├── restaurant-status-badge.tsx    # Status badge (active/suspended/etc)
│       ├── restaurant-form.tsx            # Reusable create/edit form
│       ├── restaurant-detail-view.tsx     # Detail info grid
│       ├── restaurant-actions.tsx         # Action buttons + dropdown
│       ├── confirm-action-dialog.tsx      # Confirmation dialog
│       └── __tests__/
│           ├── restaurant-status-badge.test.tsx
│           ├── restaurant-form.test.tsx
│           ├── restaurant-detail-view.test.tsx
│           ├── restaurant-actions.test.tsx
│           └── confirm-action-dialog.test.tsx
└── app/(protected)/
    └── restaurants/
        ├── page.tsx              # List page (server-side paginated)
        ├── create/
        │   └── page.tsx          # Create page
        └── [id]/
            ├── page.tsx          # Detail page
            └── edit/
                └── page.tsx      # Edit page
```

### Data Flow
1. **List page** -> `useRestaurants(params)` -> `GET /restaurants?page=&limit=&search=&status=`
2. **Detail page** -> `useRestaurant(id)` -> `GET /restaurants/:id`
3. **Create form** -> `useCreateRestaurant()` -> `POST /restaurants`
4. **Edit form** -> `useUpdateRestaurant()` -> `PUT /restaurants/:id`
5. **Activate/Suspend/Archive** -> mutations with `ConfirmActionDialog`

### Key Patterns
- **Server-side pagination**: List page uses manual pagination via `page`/`limit` params to the API
- **Optimistic updates**: Mutations invalidate the restaurant query cache on success
- **Form validation**: Zod schemas in `restaurant-schemas.ts` with React Hook Form
- **Status badge**: Color-coded badge component mapped to restaurant status
- **Confirmation dialogs**: Used for all destructive/state-changing actions

## Types

### RestaurantStatus
`draft | pending | active | suspended | inactive | archived`

### Status → Badge Variants
| Status    | Badge Variant |
|-----------|---------------|
| active    | success       |
| pending   | warning       |
| draft     | secondary     |
| suspended | danger        |
| inactive  | warning       |
| archived  | default       |

## Available Actions
- **Edit**: Navigates to `/restaurants/:id/edit`
- **Activate**: PATCH `/restaurants/:id/activate`
- **Suspend**: PATCH `/restaurants/:id/suspend`
- **Archive**: DEL `/restaurants/:id/archive`

## Tests
39 tests covering: hooks (CRUD + schemas), status badge, form rendering, detail view, action dialogs, and action workflow.
