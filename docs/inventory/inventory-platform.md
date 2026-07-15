# Enterprise Inventory & Purchasing Platform — Phase 14.4

## Overview

The Enterprise Inventory & Purchasing Platform is an independent bounded context within TableFlow, following Domain-Driven Design and Clean Architecture. It manages ingredient catalog, stock tracking, purchase orders, recipe costing, and inventory policies without external API dependencies.

## Architecture

```
modules/inventory/
├── domain/
│   ├── models/          # Aggregate roots & value objects
│   │   ├── Ingredient.ts         (# category, unit, perishability, shelf life)
│   │   ├── StockItem.ts          (# batch, location, expiry tracking)
│   │   ├── StockMovement.ts      (# 6 movement types: Purchase/Consumption/Adjustment/Waste/Return/Transfer)
│   │   ├── Recipe.ts             (# ingredients with waste%, scaling, cost calc)
│   │   ├── Supplier.ts           (# status, lead time, minimum order)
│   │   ├── PurchaseOrder.ts      (# 5-state FSM: Draft→Submitted→Approved→Received, Cancelled)
│   │   └── InventoryPolicy.ts    (# min/max, reorder point/quantity)
│   ├── events/          # 7 domain events
│   ├── repositories/    # Interfaces: StockItemRepository, PurchaseOrderRepository, IngredientRepository
│   └── services/        # StockCalculator, RecipeEngine, ExpirationService
├── application/
│   ├── services/        # InventoryManager, PurchasingService
│   └── dtos/            # StockMovementDto, PurchaseOrderDto, RecipeDto
├── infrastructure/
│   └── repositories/    # In-memory implementations
├── errors/              # InsufficientStockError, RecipeError, PurchaseOrderError
└── tests/               # 8 test files, 45 tests
```

## Key Domain Logic

- **PurchaseOrder FSM**: Transitions defined in `PURCHASE_ORDER_TRANSITIONS`. Partial receipt supported via `receivedQuantity` per line item.
- **Stock Consumption**: Uses FIFO-by-expiry order (via `ExpirationService.suggestUsageOrder`) — deducts from soonest-expiring batches first.
- **Recipe Engine**: `calculateConsumption` uses `scaleIngredients` (quantity × ratio); `getRequiredIngredients` includes waste percent. Waste is factored into purchase requirement calculation, not base cost.
- **Inventory Policy**: `needsReorder`, `isOverstocked`, `isBelowMinimum`, `getRecommendedOrderQuantity`.
- **Expiration Service**: Configurable critical/warning thresholds. `suggestUsageOrder` sorts items by expiry date (earliest first, non-expiring last).

## Integration Points

- **Event Bus**: Domain events (`StockUpdated`, `IngredientConsumed`, `PurchaseCreated`, `PurchaseApproved`, `PurchaseReceived`, `StockLowDetected`, `InventoryExpired`) from `domain/events/`.
- **Scheduler**: For periodic expiration checks and overdue delivery validation.
- **Observability**: `Configuration Center` for policy thresholds.

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `EXPIRE_CRITICAL_DAYS` | 1 | Days before expiry for critical alert |
| `EXPIRE_WARNING_DAYS` | 7 | Days before expiry for warning alert |

## Tests

```bash
npx vitest run src/modules/inventory/tests
```

8 test files, 45 tests covering unit tests for all models, services, and a full integration test.

## Future Considerations

- Supplier integrations (API-based ordering)
- Accounting integration (COGS posting)
- Barcode / RFID hardware integration
- Real-time POS synchronization
