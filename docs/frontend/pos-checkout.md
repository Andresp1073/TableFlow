# POS / Checkout Module

## Overview

The POS/Checkout module provides a complete point-of-sale system for the TableFlow hospitality platform. It includes order management (sales orders), kitchen integration (via the Kitchen module's ticket system), and payment processing (via the Payments module).

## Architecture

### Backend - Sales Order Module (`apps/backend/src/modules/sales/`)

```
sales/
├── index.ts                              # Barrel exports
├── domain/
│   ├── index.ts
│   ├── models/
│   │   ├── index.ts
│   │   ├── OrderStatus.ts                # Order status enum + transitions
│   │   ├── OrderItem.ts                  # Line item model with quantity/price
│   │   └── SalesOrder.ts                 # Core aggregate: order with items, totals, state machine
│   ├── services/
│   │   ├── index.ts
│   │   ├── OrderCalculator.ts            # Order summary, tax, discount, split
│   │   └── OrderValidator.ts             # Validation for submission/payment
│   └── repositories/
│       ├── index.ts
│       └── SalesOrderRepository.ts       # Repository interface
├── application/
│   ├── index.ts
│   ├── dtos/
│   │   ├── index.ts
│   │   ├── CreateOrderDto.ts             # Zod schemas for order creation
│   │   ├── UpdateOrderDto.ts             # Zod schema for order update
│   │   ├── OrderDto.ts                   # Response DTOs (OrderDto, OrderDashboardDto)
│   │   └── CheckoutDto.ts               # Checkflow DTOs (submit, payment, receipt)
│   └── services/
│       ├── index.ts
│       └── OrderManager.ts               # Application service for order CRUD
├── errors/
│   ├── index.ts
│   └── OrderError.ts                     # OrderError, OrderNotFoundError, etc.
├── infrastructure/
│   ├── index.ts
│   └── repositories/
│       ├── index.ts
│       └── InMemorySalesOrderRepository.ts  # In-memory implementation
└── presentation/
    ├── controllers/
    │   ├── index.ts
    │   ├── OrderController.ts            # REST handlers for orders
    │   └── CheckoutController.ts         # REST handlers for checkout flow
    └── routes/
        ├── index.ts
        ├── orders.routes.ts              # Express router - mounted at /restaurants/:id/orders
        └── checkout.routes.ts            # Express router - mounted at /restaurants/:id/checkout
```

### Frontend - Orders Components (`apps/frontend/src/components/orders/`)

| Component | Purpose |
|-----------|---------|
| `order-status-badge.tsx` | Renders order status as a colored badge |
| `order-list.tsx` | Card-based order list with loading/error/empty states |
| `order-detail-view.tsx` | Full order detail with items, summary, actions |
| `order-form.tsx` | Create/edit order form with dynamic item rows |
| `order-dashboard-content.tsx` | Dashboard stats grid (active, submitted, revenue, etc.) |

### Frontend - POS Components (`apps/frontend/src/components/pos/`)

| Component | Purpose |
|-----------|---------|
| `pos-interface.tsx` | Main POS layout: menu items grid + order summary + checkout flow |
| `order-summary.tsx` | Current order sidebar with items, totals, clear/remove |
| `payment-form.tsx` | Payment method selection, tip options, provider selection |

### Frontend - Pages

| Route | File | Purpose |
|-------|------|---------|
| `/orders` | `app/(protected)/orders/page.tsx` | Order list with dashboard and status tabs |
| `/orders/new` | `app/(protected)/orders/new/page.tsx` | Create new order form |
| `/orders/[orderId]` | `app/(protected)/orders/[orderId]/page.tsx` | Order detail with submit/pay/cancel actions |
| `/pos` | `app/(protected)/pos/page.tsx` | Live point-of-sale interface |

## API Endpoints

### Orders (`/restaurants/:id/orders`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Order dashboard stats |
| GET | `/` | List orders (optional `?status=` filter) |
| GET | `/:orderId` | Get order detail |
| POST | `/` | Create order |
| PUT | `/:orderId` | Update order metadata |
| PATCH | `/:orderId/cancel` | Cancel order |
| POST | `/:orderId/items` | Add item to draft order |
| PATCH | `/:orderId/items/:itemId` | Update item quantity |
| DELETE | `/:orderId/items/:itemId` | Remove item from draft order |

### Checkout (`/restaurants/:id/checkout`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/:orderId/submit` | Submit order to kitchen (creates tickets) |
| POST | `/:orderId/pay` | Process payment |
| GET | `/:orderId/status` | Get order + kitchen ticket status |

## Data Flow

1. **Create Order** → POS creates a draft order with items
2. **Submit Order** → Draft order transitions to Submitted; kitchen tickets created for each station
3. **Process Payment** → Payment intent created → authorized → captured → order marked Completed + Paid

## Key Types (`lib/sales-types.ts`)

- `SalesOrder` - Full order with items, totals, payment info
- `OrderItem` - Line item with quantity, price, modifiers
- `OrderDashboard` - Aggregate stats for dashboard
- `SubmitOrderResult` - Result of submitting order to kitchen
- `PaymentResult` - Result of processing payment

## Tests

Located in `components/orders/__tests__/` and `components/pos/__tests__/`:

| Test File | Tests |
|-----------|-------|
| `sales-types.test.ts` | Utility functions (formatCurrency, status colors, labels) |
| `order-list.test.tsx` | Loading, error, empty, card rendering |
| `order-detail-view.test.tsx` | Loading, error, order details, submit button |
| `order-summary.test.tsx` | Empty state, items, remove, clear |
| `payment-form.test.tsx` | Total display, method buttons, tips, success state |
