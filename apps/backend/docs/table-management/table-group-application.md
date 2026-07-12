# Table Group Application Layer (Phase 11.6.2)

## Overview
The application layer orchestrates table group use cases — creation, updates, release, and queries. It bridges the domain layer (pure DDD) with infrastructure (repositories, event bus, audit).

## Architecture

```
Presentation (Controller)
  │
  ▼
Application Service ──► Validator
  │                       │
  ├── Authorize (IAM)     │
  ├── Validate ───────────┘
  ├── Domain Services (TableGroupingPolicy, GroupCapacityCalculator)
  ├── Repository (save, update, findByIdAndRestaurant, findByFilters)
  ├── EventBus (emit domain events)
  ├── AuditService (record action)
  └── CacheInvalidator (optional, post-action hook)
```

## Use Cases

| Use Case | Command/Query | Permission |
|---|---|---|
| Create Table Group | `CreateTableGroupCommand` | `restaurants.table-groups.create` |
| Update Table Group | `UpdateTableGroupCommand` | `restaurants.table-groups.update` |
| Release Table Group | `ReleaseTableGroupCommand` | `restaurants.table-groups.release` |
| Get Table Group | `GetTableGroupQuery` | `restaurants.table-groups.read` |
| List Table Groups | `ListTableGroupsQuery` | `restaurants.table-groups.read` |

## Commands

### CreateTableGroupCommand
```
{
  restaurantId: string;     // required
  name: string;             // required, 1-100 chars
  description?: string;     // optional
  tableIds: string[];       // required, min 2, no duplicates
}
```

### UpdateTableGroupCommand
```
{
  id: string;               // required, group UUID
  restaurantId: string;     // required
  name?: string;            // optional, 1-100 chars
  description?: string;     // optional (null clears it)
  tableIds?: string[];      // optional, min 2 if provided
  updatedBy: string;        // required
}
```

### ReleaseTableGroupCommand
```
{
  id: string;
  restaurantId: string;
}
```

## Queries

### GetTableGroupQuery
```
{
  id: string;
  restaurantId: string;
}
```

### ListTableGroupsQuery
```
{
  restaurantId: string;
  status?: string;          // optional filter
}
```

## DTOs

### TableGroupDTO (full response)
```
{
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  status: string;
  isActive: boolean;
  createdBy: string;
  members: Array<{
    tableId: string;
    displayOrder: number;
    joinedAt: string;       // ISO 8601
  }>;
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  releasedAt: string | null;
}
```

### TableGroupSummary (list view)
```
{
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  status: string;
  isActive: boolean;
  memberCount: number;
  totalCapacity: number;
  createdAt: string;
  updatedAt: string;
}
```

## DTO Mapping

`TableGroupMapper` handles all DTO conversions:

- `toDTO(group)` — full domain → full DTO
- `toSummary(group)` — domain → summary (list view)
- `toDTOList(groups)` — multiple → DTO array
- `toSummaryList(groups)` — multiple → summary array

Capacity is NOT stored on the domain entity. The mapper computes it using `GroupCapacityCalculator` from member table capacities.

## Validation

`TableGroupValidator` validates request payloads before passing to the application service:

- **Create**: restaurantId required, name required (1-100 chars), min 2 tableIds, no duplicates
- **Update**: name optional (1-100 if provided), tableIds optional (min 2, no duplicates)

Business rules (minimum members, same restaurant, no archived tables, no active group overlap, no terminal state modification) are delegated to the domain layer (`TableGroupingPolicy`).

## Transaction Boundaries

Each use case method is a single transaction boundary:

1. Authorize (IAM)
2. Validate input
3. Fetch existing data (if update/release)
4. Apply domain services (policy checks, capacity calc)
5. Build/update aggregate via factory
6. Persist via repository
7. Emit domain events
8. Record audit entry
9. Invalidate cache (optional)

Steps 6-9 should be wrapped in a single database transaction in the infrastructure layer.

## Error Handling

| Domain Error | Application Behavior |
|---|---|
| `TableGroupNotFoundError` | 404 — group not found |
| `InsufficientTablesError` | 422 — less than 2 tables |
| `DuplicateTableInGroupError` | 409 — duplicate table |
| `InvalidRestaurantGroupError` | 422 — table in wrong restaurant |
| `InvalidTableGroupError` | 422 — archived table, active group overlap, terminal state |
| `TableGroupValidationError` | 400 — invalid input format |

Domain errors are never exposed directly; they are caught and translated into application-level error responses.

## Cache Invalidation

`TableGroupCacheInvalidator` is an optional interface injected into the application service. No infrastructure-specific implementation is provided at this layer.

```typescript
interface TableGroupCacheInvalidator {
  invalidateOnCreate(restaurantId: string): Promise<void>;
  invalidateOnUpdate(groupId: string, restaurantId: string): Promise<void>;
  invalidateOnRelease(groupId: string, restaurantId: string): Promise<void>;
}
```

## Audit Integration

All mutating operations (create, update, release) record audit entries via `AuditService.record()` with:
- `module: "restaurant"`
- `entityType: "table_group"`
- Old and new values for change tracking
- Request metadata (IP, user agent, request ID)

## Files

| File | Description |
|---|---|
| `application/commands/CreateTableGroupCommand.ts` | Create command interface |
| `application/commands/UpdateTableGroupCommand.ts` | Update command interface |
| `application/commands/ReleaseTableGroupCommand.ts` | Release command interface |
| `application/queries/GetTableGroupQuery.ts` | Single group query |
| `application/queries/ListTableGroupsQuery.ts` | List groups query |
| `application/dto/TableGroupDTO.ts` | Full response DTO |
| `application/dto/TableGroupSummary.ts` | Summary list DTO |
| `application/dto/TableGroupRequestDTO.ts` | Request DTOs (create/update) |
| `application/dto/TableGroupMapper.ts` | Domain ↔ DTO mapper |
| `application/validators/TableGroupValidator.ts` | Input validation |
| `application/services/TableGroupApplicationService.ts` | Orchestrator service |
| `application/services/TableGroupCacheInvalidator.ts` | Cache invalidation interface |
| `application/index.ts` | Barrel exports |
