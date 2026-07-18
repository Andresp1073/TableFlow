# Inventory Management Module

## Architecture

The Inventory Management module follows a feature-based architecture within the monorepo:

```
apps/
├── backend/
│   └── src/modules/inventory/
│       ├── domain/              # Domain models, events, repositories, services
│       ├── application/         # Application services (InventoryManager, PurchasingService)
│       ├── infrastructure/      # In-memory repository implementations
│       ├── errors/              # Domain errors (InsufficientStockError, etc.)
│       ├── presentation/        # API controllers and routes (NEW)
│       └── tests/               # Backend domain tests
├── frontend/
│   └── src/
│       ├── app/(protected)/inventory/  # Pages (App Router)
│       ├── components/inventory/       # Feature components
│       ├── hooks/use-inventory.ts      # TanStack Query hooks
│       ├── lib/inventory-types.ts      # TypeScript types & constants
│       └── services/inventory.ts       # API service layer
```

### Frontend Structure

```
components/inventory/
├── dashboard/        # Inventory dashboard widgets
├── products/         # Product list, detail, form
├── categories/       # Category list
├── suppliers/        # Supplier list, detail, form
├── stock/            # Stock level table
├── stock-movements/  # Movement history table
├── purchase-orders/  # PO list, detail, form
├── receiving/        # Stock receiving form
├── alerts/           # Alerts view
├── shared/           # Shared components (badges, filters, page header)
└── __tests__/        # Component tests
```

## Inventory Workflow

### Stock Lifecycle

```
Supplier → Purchase Order → Receiving → Stock Items → Consumption
                                                        ↓
                                                    Waste/Adjustment
```

1. **Create Purchase Order** - Draft orders to suppliers with line items
2. **Submit & Approve** - State machine: Draft → Submitted → Approved → Received
3. **Receive Stock** - Record incoming items, create stock batches with batch codes and expiry
4. **Manage Stock** - View current levels, reserved, available, min/max thresholds
5. **Consume Stock** - Usage in production (FEFO - First Expiry, First Out)
6. **Track Movements** - All stock changes recorded with type, reason, and user

### Purchase Order State Machine

```
Draft → Submitted → Approved → Received (terminal)
  ↓         ↓           ↓
Cancelled (terminal from any non-terminal state)
```

### Stock Movement Types

| Type | Direction | Description |
|------|-----------|-------------|
| Purchase | Increase | Stock received from supplier |
| Consumption | Decrease | Used in production |
| Adjustment | Both | Manual stock correction |
| Waste | Decrease | Spoiled or damaged goods |
| Return | Increase | Returned to stock |
| Transfer | Both | Moved between locations |

## Permissions

The module respects backend RBAC permissions. UI actions are hidden based on user permissions:

- `inventory.products.read` - View products
- `inventory.products.create` - Create products
- `inventory.products.update` - Edit products
- `inventory.products.archive` - Archive/restore products
- `inventory.purchase_orders.create` - Create purchase orders
- `inventory.purchase_orders.approve` - Submit/approve orders
- `inventory.purchase_orders.receive` - Receive orders
- `inventory.stock.adjust` - Adjust stock levels
- `inventory.alerts.view` - View inventory alerts

## API Integration

### Base URL

All inventory endpoints are scoped to a restaurant:

```
/restaurants/{restaurantId}/inventory/{resource}
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Inventory dashboard summary |
| GET | `/products` | List products (paginated, filterable) |
| GET | `/products/:id` | Get product with stock batches |
| POST | `/products` | Create product |
| PUT | `/products/:id` | Update product |
| PATCH | `/products/:id/archive` | Archive product |
| PATCH | `/products/:id/restore` | Restore product |
| GET | `/categories` | List categories with counts |
| GET | `/suppliers` | List suppliers |
| GET | `/suppliers/:id` | Get supplier with products |
| POST | `/suppliers` | Create supplier |
| GET | `/stock` | Stock summary across all products |
| GET | `/stock/items` | Stock items (filterable by ingredient) |
| GET | `/stock-movements` | Movement history (paginated, filterable) |
| GET | `/purchase-orders` | List purchase orders (paginated) |
| GET | `/purchase-orders/:id` | Get PO with line items |
| POST | `/purchase-orders` | Create PO |
| PATCH | `/purchase-orders/:id/submit` | Submit PO |
| PATCH | `/purchase-orders/:id/approve` | Approve PO |
| POST | `/purchase-orders/:id/receive` | Receive PO items |
| PATCH | `/purchase-orders/:id/cancel` | Cancel PO |
| POST | `/receiving` | Direct stock receiving |
| GET | `/alerts` | All inventory alerts |

### Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
  message?: string;
}
```

### Pagination

List endpoints support `page` and `limit` query parameters. Response includes `meta` with pagination details.

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `inventory.insufficient_stock` | 422 | Not enough stock available |
| `inventory.purchase_order_error` | 400 | Invalid PO state transition |
| `inventory.recipe_error` | 400 | Invalid recipe configuration |

## Data Types

### Product (Ingredient)

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| name | string | Product name |
| category | enum | RawMaterial, Prepared, FinishedProduct, Consumable, Packaging |
| unit | enum | Kg, G, L, Ml, Units, Pieces, Boxes, Cases, Bags |
| costPerUnit | number | Average cost per unit |
| currentStock | number | Total quantity in stock |
| isActive | boolean | Whether product is active |
| perishable | boolean | Whether item expires |
| shelfLifeDays | number | Days before expiry (nullable) |

### Purchase Order

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| status | enum | Draft, Submitted, Approved, Received, Cancelled |
| items | LineItem[] | Order line items with quantities |
| totalAmount | number | Sum of line item totals |
| isFullyReceived | boolean | All items received |
| expectedDeliveryAt | string | Expected delivery date |

## Frontend State Management

All data fetching uses TanStack Query with the following conventions:

- **Query keys**: `['inventory', resource, restaurantId, params]`
- **Stale time**: 30s default, 15s for movements, 60s for categories/alerts
- **Refetch interval**: 60s for dashboard, 120s for alerts
- **Retry policy**: 2 retries by default
- **Cache invalidation**: Mutations invalidate related query keys on success

## Responsive Design

The module supports all screen sizes:

- **Desktop (≥1024px)**: Full grid layouts, multi-column tables
- **Tablet (640-1023px)**: 2-column grids, scrollable tables
- **Mobile (<640px)**: Single column, horizontal scroll on tables

## Accessibility

- ARIA labels on all interactive elements
- `role="alert"` on error states
- `aria-sort` on sortable table columns
- Keyboard navigation via Radix UI primitives
- Focus-visible rings on all focusable elements
- Screen reader friendly loading states

## Testing

### Test Coverage

- **Dashboard**: Loading, error, stat cards, low stock, pending orders, movements
- **Products**: Loading, error, empty, product rows, status badges
- **Stock**: Loading, error, low stock/overstock/OK badges, empty state
- **Purchase Orders**: Loading, error, status badges, received counts, empty state
- **Alerts**: Loading, error, alert cards, count badges, item display
- **Utilities**: Status color mapping, currency formatting, unit formatting

### Running Tests

```bash
pnpm --filter @tableflow/frontend test -- --run src/components/inventory/__tests__/
```
