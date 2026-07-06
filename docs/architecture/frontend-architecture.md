# Frontend Architecture

**Last updated:** 2026-07-04

## Application Organization

The frontend follows a **feature-based organization** inside `src/`, with shared primitives in `components/ui/` and cross-cutting concerns in `hooks/`, `services/`, and `utils/`.

```
src/
├── assets/            # Static files (images, fonts, icons)
├── components/        # Reusable components
│   ├── ui/            # Atomic design primitives
│   ├── layout/        # Layout components
│   └── shared/        # Domain-agnostic reusable components
├── features/          # Feature modules
│   ├── auth/
│   ├── reservations/
│   ├── tables/
│   ├── customers/
│   └── ...
├── hooks/             # Global shared hooks
├── services/          # API client (Axios)
├── lib/               # Library configs (TanStack Query, Axios)
├── stores/            # Global client state (Zustand/Context)
├── types/             # Global TypeScript types
├── utils/             # Utility functions
├── routes/            # Route definitions
├── styles/            # Global CSS, Tailwind config
├── App.tsx            # Root component
└── main.tsx           # Entry point
```

---

## Pages

Pages are route-level components that compose features and layouts.

| Pattern | Example |
|---------|---------|
| `{Feature}{Action}Page` | `ReservationCreatePage`, `ReservationListPage` |

**Responsibility:**
- Fetch necessary data (via hooks).
- Compose page layout (header, content, sidebar).
- Handle page-level errors and loading states.
- **No business logic.**

```typescript
// Page pattern
function ReservationListPage() {
  const { data, isLoading, error } = useReservations(filters);

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <PageLayout>
      <PageHeader title="Reservations" action={<CreateButton />} />
      <ReservationFilters onFilter={setFilters} />
      <ReservationTable data={data} />
    </PageLayout>
  );
}
```

---

## Layouts

Layouts wrap pages and provide common structure.

| Component | Use |
|-----------|-----|
| `AuthLayout` | Login, register, password reset |
| `DashboardLayout` | Main app with sidebar + header |
| `PublicLayout` | Public-facing pages (future widget) |

Layouts are defined in the route configuration, not inside pages.

```typescript
// Route configuration pattern
const routes = [
  {
    element: <DashboardLayout />,
    children: [
      { path: 'reservations', element: <ReservationListPage /> },
      { path: 'reservations/new', element: <ReservationCreatePage /> },
    ],
  },
];
```

---

## Features

Each feature is a self-contained module inside `src/features/{feature}/`.

```
features/reservations/
├── components/          # Feature-specific components
│   ├── ReservationForm.tsx
│   ├── ReservationCard.tsx
│   ├── ReservationCalendar.tsx
│   └── ReservationFilters.tsx
├── hooks/               # Feature-specific hooks
│   ├── useReservations.ts
│   ├── useCreateReservation.ts
│   └── useCancelReservation.ts
├── pages/               # Feature page components
│   ├── ReservationListPage.tsx
│   ├── ReservationCreatePage.tsx
│   └── ReservationEditPage.tsx
├── schemas/             # Zod validation schemas
│   └── reservation.schema.ts
├── types.ts             # Feature-specific types
└── index.ts             # Public API of the feature
```

**Rules:**
- A feature module **never imports from another feature's internal files**. If shared logic is needed, extract it to `hooks/`, `services/`, or `utils/`.
- Feature `index.ts` exports only what other features need (typically no direct component exports — only hooks).
- Feature `schemas/` mirrors backend validation schemas for consistency.

---

## Shared Components

### UI Primitives (`components/ui/`)

Atomic design components with no business logic:

```
ui/
├── Button.tsx
├── Input.tsx
├── Select.tsx
├── Modal.tsx
├── Badge.tsx
├── Card.tsx
├── DataTable.tsx
├── Pagination.tsx
├── Spinner.tsx
├── Skeleton.tsx
├── Toast.tsx
└── index.ts
```

- Each component accepts `className` for style customization.
- Fully typed with TypeScript.
- Accessible (keyboard, ARIA, focus management).

### Layout Components (`components/layout/`)

```
layout/
├── Sidebar.tsx
├── Header.tsx
├── DashboardLayout.tsx
├── AuthLayout.tsx
└── PageLayout.tsx
```

### Shared Domain Components (`components/shared/`)

Components that combine UI primitives with domain concepts:

```
shared/
├── SearchInput.tsx
├── DateRangePicker.tsx
├── StatusBadge.tsx
├── ConfirmDialog.tsx
├── EmptyState.tsx
└── ErrorState.tsx
```

---

## Hooks

### Global Hooks (`hooks/`)

```
hooks/
├── useAuth.ts            # Auth state, login/logout functions
├── useDebounce.ts        # Debounced value
├── useMediaQuery.ts      # Responsive breakpoints
└── usePagination.ts      # Pagination state
```

### Feature Hooks

Feature hooks use TanStack Query for server state:

```typescript
// Pattern: feature hooks
export function useReservations(filters: ReservationFilters) {
  return useQuery({
    queryKey: ['reservations', filters],
    queryFn: () => reservationService.list(filters),
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReservationDTO) => reservationService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });
}
```

---

## State Management

| State Type | Tool | Rationale |
|------------|------|-----------|
| Server state | TanStack Query | Caching, refetching, optimistic updates |
| Client state | Zustand (or React Context) | Minimal boilerplate, TypeScript-native |
| Form state | React Hook Form | Uncontrolled inputs, performant |
| URL state | React Router params | Search filters, pagination, tabs |
| Transient UI state | Local `useState` | Modals, tooltips, dropdowns |

---

## Data Fetching

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| HTTP Client | Axios | Base URL, interceptors (auth token, error transform) |
| Query Layer | TanStack Query | Caching, deduplication, retry, pagination |
| Service Layer | Custom service objects | API endpoint methods, typed responses |

```typescript
// Service pattern
class ReservationService {
  private readonly basePath = '/api/v1/reservations';

  async list(filters: ReservationFilters): Promise<PaginatedResponse<ReservationDTO>> {
    const response = await api.get(this.basePath, { params: filters });
    return response.data;
  }

  async create(data: CreateReservationDTO): Promise<ReservationDTO> {
    const response = await api.post(this.basePath, data);
    return response.data;
  }
}

export const reservationService = new ReservationService();
```

---

## Routing

```typescript
// Route structure
const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'reservations', element: <ReservationListPage /> },
      { path: 'reservations/new', element: <ReservationCreatePage /> },
      { path: 'reservations/:id', element: <ReservationDetailPage /> },
      { path: 'reservations/:id/edit', element: <ReservationEditPage /> },
      { path: 'tables', element: <TableListPage /> },
      { path: 'customers', element: <CustomerListPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
```

Protected routes use a `ProtectedRoute` wrapper that checks auth state and redirects to login.

---

## Validation

- **Frontend & Backend share Zod schemas** as a package (`packages/shared/`).
- Frontend validation runs on blur (not keystroke) for performance.
- Error messages match backend error format for consistency.

```typescript
// Shared schema
export const createReservationSchema = z.object({
  customerId: z.string().uuid(),
  branchId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().int().min(1).max(20),
  notes: z.string().max(500).optional(),
});
```

---

## Error Handling

- Axios interceptor transforms API errors into a consistent format.
- TanStack Query `onError` callbacks handle retry logic.
- Global `ErrorBoundary` at the router level catches unhandled React errors.
- Feature-level error boundaries for isolated error recovery.

```typescript
// Axios error interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<APIError>) => {
    if (error.response?.status === 401) {
      // Attempt token refresh, redirect to login if failed
    }
    if (error.response?.status === 403) {
      // Show permission denied toast
    }
    return Promise.reject(error.response?.data);
  },
);
```

---

## Performance

| Strategy | Implementation |
|----------|----------------|
| Code splitting | Dynamic imports at route level via `lazy()` |
| Bundle size | Vite rollup options, manual chunks |
| Image optimization | Vite asset handling, lazy loading |
| Memoization | `useMemo`, `useCallback` for expensive computations |
| List virtualization | `react-virtuoso` for large tables |

---

## Related Documents

- [architecture-overview.md](./architecture-overview.md) — System layers
- [design-patterns.md](./design-patterns.md) — Patterns used in frontend
- [folder-structure.md](./folder-structure.md) — Complete tree
