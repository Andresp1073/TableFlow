# Audit Module

## Overview

Generic, immutable audit trail for every significant action across all TableFlow modules. Designed as a reusable module — not tied to any specific domain. Other modules call `auditService.record()` to create entries without importing domain internals.

## Architecture

```
src/modules/audit/
  domain/
    models/
      AuditAction.ts    — Value Object: action type enum
      AuditModule.ts    — Value Object: module name enum
      AuditEntry.ts     — Aggregate interface
    events/
      AuditEntryCreated.ts
    repositories/
      AuditRepository.ts  — Repository interface + search/pagination types
      AuditFactory.ts     — Factory interface (create + reconstitute)
    services/
      AuditContext.ts      — Interface to extract request context
      AuditSerializer.ts   — Interface to diff entity snapshots
  application/
    commands/
      CreateAuditEntryCommand.ts
    queries/
      GetAuditEntryQuery.ts
      SearchAuditEntriesQuery.ts
    dto/
      AuditEntryDTO.ts
      AuditEntryMapper.ts
    services/
      AuditService.ts              — Public interface for modules to inject
      AuditApplicationService.ts   — Implements AuditService + use cases
      AuditPublisher.ts            — Interface for async event publishing
  infrastructure/
    repositories/
      PrismaAuditRepository.ts
      ConcreteAuditFactory.ts
  presentation/
    controllers/
      AuditController.ts
    routes/
      audit.routes.ts
    validation/
      audit.validation.ts
  errors/
    AuditEntryNotFoundError.ts
```

## Integration Guide

### Step 1: Inject `AuditService`

```typescript
import type { AuditService } from "../../audit/application/services/AuditService.js";

class SomeApplicationService {
  constructor(
    private readonly auditService: AuditService,
    // ... other deps
  ) {}
}
```

### Step 2: Record audit entries

```typescript
await this.auditService.record({
  organizationId: auth.organizationId,
  module: "restaurant",
  entityType: "restaurant",
  entityId: restaurant.id,
  action: "create",
  performedBy: auth.userId,
  restaurantId: restaurant.id,
  ipAddress: metadata.ipAddress,
  userAgent: metadata.userAgent,
  requestId: metadata.requestId,
  newValues: { name: restaurant.name, slug: restaurant.slug },
});
```

### Step 3: Pass the `AuditService` implementation

The `AuditApplicationService` already implements `AuditService`. Inject it:

```typescript
const auditService = new AuditApplicationService(repository, factory, eventBus);
const someService = new SomeApplicationService(auditService);
```

## API Endpoints

All endpoints require `audit.read` permission.

### `GET /api/v1/audit`

List audit entries with optional filters (module, entityType, entityId, action, performedBy, restaurantId, startDate, endDate). Supports pagination via `page` and `limit` query params.

### `GET /api/v1/audit/:id`

Get a single audit entry by UUID.

## Supported Actions

`create`, `update`, `delete`, `archive`, `restore`, `login`, `logout`, `activate`, `deactivate`, `assign`, `revoke`

## Supported Modules

`restaurant`, `table`, `reservation`, `customer`, `employee`, `user`, `role`, `permission`, `auth`, `audit`, `notification`, `organization`, `branch`, `settings`, `system`

## Event Sourcing Strategy (Future)

The `AuditEntry` model provides a foundation for eventual event sourcing:

1. **Phase 1 (current)**: Immutable append-only log. Each action produces one `AuditEntry` row.
2. **Phase 2**: Add `eventType` and `aggregateId` columns to support event replay.
3. **Phase 3**: Introduce an `EventStore` abstraction backed by the same table, with snapshot support for aggregates.
4. **Phase 4**: Migrate high-volume aggregates (reservations) to a dedicated event store with Kafka/RabbitMQ integration.

The `AuditPublisher` interface allows plugging in external event buses without changing domain logic.

## Permissions

| Code | Description |
|------|-------------|
| `audit.read` | View audit log entries |
| `audit.readSensitive` | View sensitive entries (auth changes, role changes) |
| `audit.export` | Export audit logs |
| `audit.configureRetention` | Configure audit log retention policy |

## Database

Table: `audit_entries` (MySQL)

Indexes:
- `(organizationId, createdAt)` — default time-range queries
- `(organizationId, module)` — module-based filtering
- `(organizationId, entityType, entityId)` — entity history queries
- `(organizationId, action)` — action-based filtering
- `(performedBy)` — user audit trail
- `(restaurantId)` — restaurant-scoped queries
