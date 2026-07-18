# Enterprise Operations Dashboard

## Architecture

### Overview
The dashboard is a widget-based operational view that aggregates data from multiple backend services into a single page. Each widget operates independently with its own loading, error, and refresh lifecycle.

### Files Structure
```
src/components/dashboard/
  dashboard-grid.tsx          # Responsive grid layout
  dashboard-widget.tsx        # Widget wrapper (loading/error/empty states)
  quick-actions.tsx           # Quick action shortcut buttons
  widgets/
    today-reservations.tsx    # Today's reservation counts by status
    current-occupancy.tsx     # Live occupancy rate with progress bar
    available-tables.tsx      # Table availability breakdown
    kitchen-status.tsx        # Kitchen ticket status (KDS integration)
    pending-orders.tsx        # Pending order queue
    low-inventory-alerts.tsx  # Low-stock alerts
    revenue-summary.tsx       # Revenue figures (today/week/month)
    recent-activity.tsx       # Latest audit log entries
    upcoming-reservations.tsx # Next reservations list
    quick-statistics.tsx      # Aggregate KPI stats
    index.ts                  # Barrel exports
  index.ts                    # Barrel exports
  __tests__/
    dashboard-widget.test.tsx
    dashboard-grid.test.tsx
    quick-actions.test.tsx
    widgets.test.tsx

src/hooks/use-dashboard.ts    # React Query hooks for dashboard data
src/services/dashboard.ts     # API service for dashboard endpoints
src/lib/dashboard-types.ts    # TypeScript interfaces for all dashboard data
```

## Widget Lifecycle

Each widget follows a consistent lifecycle:

1. **Mount** → starts data fetch via `useDashboardWidget(restaurantId, widgetType)`
2. **Loading** → shows `WidgetSkeleton` (shimmer placeholders)
3. **Success (empty)** → shows `EmptyState` with contextual message
4. **Success (data)** → renders widget-specific content
5. **Error** → shows error message + retry button
6. **Refresh** → user clicks refresh button → re-fetches data

```typescript
// Widget contract
interface DashboardWidgetProps {
  title: string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  onRefresh?: () => void;
  onRetry?: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}
```

## Data Loading Strategy

### Dashboard Aggregation Endpoint
- **`GET /api/v1/restaurants/:id/dashboard`** — returns all widget data in a single response
- Aggregates data from: `reservations`, `restaurant_tables`, `audit_entries`, `customers`
- Kitchen, inventory, and revenue data returned as empty until those modules have HTTP layers

### Per-Widget Hooks
```typescript
function useDashboard(restaurantId: string) {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', restaurantId],
    queryFn: () => getDashboard(restaurantId),
    refetchInterval: 60_000, // auto-refresh every 60s
    staleTime: 30_000,
    retry: 2,
  });
}
```

### Independent Widget Data
- All widgets share one `useDashboard` query to avoid N+1 API calls
- Each widget destructures its own slice: `data?.todayReservations`
- A single refresh button updates the entire dashboard

## Permission Model

Access to dashboard data is controlled by:
- **Backend**: `requireAuth` middleware + permission checks on the dashboard endpoint
- **Frontend**: The page renders within `ProtectedLayout` which requires authentication
- **Widget visibility**: Future enhancement — widget visibility can be gated by `minPermission` in `WidgetConfig`

```typescript
interface WidgetConfig {
  type: WidgetType;
  size: WidgetSize;
  title: string;
  minPermission?: string; // e.g., 'dashboard.view_revenue'
}
```

## Real-Time Preparation

The architecture is prepared for real-time updates via:
- **Polling**: `refetchInterval: 60_000` already configured in `useDashboard`
- **SSE**: Ready — hook can be swapped to `useSubscription` pattern
- **WebSocket**: Ready — widget data updates can be pushed through `DashboardContext`

Switch path: replace `useQuery` with an observable-based hook that merges initial fetch + real-time events.

## Responsive Behavior

| Breakpoint | Columns | Widget Sizing |
|-----------|---------|---------------|
| Mobile (<640px) | 1 column | All widgets full width |
| Tablet (640-1023px) | 2 columns | Key widgets span full width |
| Desktop (1024-1279px) | 3 columns | Widgets auto-flow |
| Large (1280-1535px) | 4 columns | Dense layout |
| Ultra-wide (≥1536px) | 6 columns | Maximum density |

Grid implementation uses CSS Grid with responsive `grid-cols` classes:
```tsx
<DashboardGrid>  // grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6
  <DashboardGridItem colSpan={2}>  // Spans 2 columns on desktop
    <UpcomingReservationsWidget />
  </DashboardGridItem>
</DashboardGrid>
```

## Backend Dashboard Endpoint

**File**: `apps/backend/src/modules/dashboard/presentation/routes/dashboard.routes.ts`
**Mount**: `/api/v1/restaurants/:id/dashboard`

```
GET /                          → Full dashboard data
GET /kitchen                   → Kitchen status (standalone)
GET /inventory                 → Inventory alerts (standalone)
GET /revenue                   → Revenue summary (standalone)
```

**Controller**: `DashboardController.ts` — queries Prisma directly:
- `reservation.groupBy` for today's reservation counts by status
- `restaurantTable.groupBy` for table status distribution
- `reservation.findMany` (upcoming) with customer + table includes
- `auditEntry.findMany` for recent activity log
- `customer.aggregate` for customer count

## Testing

### Dashboard Widget Tests (`widgets.test.tsx`)
- Renders data correctly for all 10 widget types
- Validates loading state (shimmer skeletons)
- Validates error state (error message + retry button)
- Validates empty state (contextual empty messages)

### Dashboard Grid Tests (`dashboard-grid.test.tsx`)
- Renders children
- Applies CSS grid classes

### Quick Actions Tests (`quick-actions.test.tsx`)
- Renders all 6 action buttons
- Validates section title

### Dashboard Widget Wrapper Tests (`dashboard-widget.test.tsx`)
- Title and children rendering
- Loading/error/empty state transitions
- Refresh button click handler
- Action slot rendering

## Widget Data Types

See `src/lib/dashboard-types.ts` for complete type definitions:
- `DashboardData` — top-level response shape
- `TodayReservationsData`, `CurrentOccupancyData`, `AvailableTablesData`
- `UpcomingReservationItem`, `RecentActivityItem`, `QuickStatisticsData`
- `KitchenStatusData`, `PendingOrdersData`, `LowInventoryAlertsData`, `RevenueSummaryData`
- `WidgetType`, `WidgetSize`, `WidgetConfig`

## Quick Actions

Six shortcut buttons in a 2-column grid:
| Action | Route | Icon |
|--------|-------|------|
| Create Reservation | `/reservations/new` | CalendarPlus |
| Open Table | `/tables` | DoorOpen |
| Manage Tables | `/tables` | Table2 |
| View Kitchen | `/kitchen` | ChefHat |
| View Inventory | `/inventory` | Package |
| Manage Customers | `/customers` | Users |

Accessible navigation via `useRouter().push()` with proper aria-labels.
