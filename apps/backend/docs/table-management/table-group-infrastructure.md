# Table Group Infrastructure Layer (Phase 11.6.3)

## Overview
The infrastructure layer implements persistence, factories, dependency injection, and database migrations for the Table Group module. It bridges the domain layer with Prisma/MySQL while maintaining DDD purity.

## Prisma Models

### TableGroup
```prisma
model TableGroup {
  id           String   @id @default(uuid()) @db.Char(36)
  restaurantId String   @db.Char(36)
  name         String   @db.VarChar(100)
  description  String?  @db.Text
  status       String   @default("active") @db.VarChar(20)
  isActive     Boolean  @default(true)
  createdBy    String   @db.Char(36)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  releasedAt   DateTime?

  restaurant Organization        @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  members    TableGroupMember[]
}
```

Key differences from previous schema:
- **`capacity` removed** — never persisted; computed at runtime by `GroupCapacityCalculator`
- **`description` added** — optional text field for group notes
- **`isActive` added** — enables soft deactivation without status transitions

### TableGroupMember
```prisma
model TableGroupMember {
  id           String   @id @default(uuid()) @db.Char(36)
  tableGroupId String   @db.Char(36)
  tableId      String   @db.Char(36)
  displayOrder Int      @default(0)
  joinedAt     DateTime @default(now())

  tableGroup TableGroup @relation(fields: [tableGroupId], references: [id], onDelete: Cascade)
}
```

Key differences from previous schema:
- **`order` renamed to `displayOrder`** — aligns with domain value object
- **`createdAt` renamed to `joinedAt`** — clearer intent
- TableGroupMember `id` is kept as Prisma requirement but not exposed in domain

## Migration

Migration `20260712030000_refactor_table_groups`:
```sql
ALTER TABLE `table_groups`
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    DROP COLUMN `capacity`;

ALTER TABLE `table_group_members`
    CHANGE COLUMN `order` `displayOrder` INT NOT NULL DEFAULT 0,
    CHANGE COLUMN `createdAt` `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
```

## Repository Implementation

### PrismaTableGroupRepository
Implements `TableGroupRepository` interface from the domain layer.

| Method | Description | Transaction |
|---|---|---|
| `save(group)` | Creates a new group with members | Yes |
| `update(group)` | Deletes all members, recreates them, updates group | Yes |
| `findById(id)` | Fetches single group by ID with members | No |
| `findByIdAndRestaurant(id, restaurantId)` | Fetches scoped to restaurant | No |
| `findByRestaurantId(restaurantId)` | Lists all groups for restaurant | No |
| `findByFilters(filters)` | Lists with optional status filter | No |
| `findActiveGroupTableIds(restaurantId)` | Returns table IDs from active groups | No |
| `findActiveGroupByTableId(tableId)` | Finds active group containing a table | No |

The `update` method uses a delete+recreate strategy for members to handle additions, removals, and reordering atomically.

## Factory

### ConcreteTableGroupFactory
Implements `TableGroupFactory` interface from the domain layer.

- **`create(data)`** — Generates a new UUID, constructs domain VOs, returns a `TableGroup` aggregate
- **`reconstitute(data)`** — Restores a domain aggregate from persisted data using `reconstitute()` methods on VOs (bypasses validation for stored data)

Key responsibilities:
- Creates `TableGroupId` from UUID
- Creates `TableGroupName` and `TableGroupStatus` VOs
- Creates `DisplayOrder` VOs for each member
- Sets default `isActive: true` and `status: active` for new groups

## Dependency Injection

### `infrastructure/di/index.ts`
Provides factory functions for wiring dependencies:

```typescript
// Create just the repository
const repository = createTableGroupRepository(prisma);

// Create the full application service with all dependencies
const service = createTableGroupApplicationService({
  prisma,
  authService,
  eventBus,
  auditService,
  cacheInvalidator,  // optional
});
```

The DI module encapsulates:
- `ConcreteTableGroupFactory` instantiation
- `PrismaTableGroupRepository` with factory
- Inline `tableRepository` adapter for fetching restaurant tables
- `TableGroupApplicationService` with all dependencies

This pattern matches the existing project convention where services are manually wired in route files.

## Transaction Boundaries

Transactions are handled at the infrastructure layer via Prisma's `$transaction`. The repository methods that modify data (`save`, `update`) should be wrapped in a Prisma transaction at the application service level or within the repository method.

For the `update` method specifically, the member delete + recreate + group update sequence must be atomic:

```
beginTransaction
  delete from table_group_members where tableGroupId = ?
  update table_groups set ... where id = ?
  insert into table_group_members (...)
commitTransaction
```

## Error Handling

| Scenario | Handling |
|---|---|
| Prisma connection error | Translated to infrastructure error |
| Record not found | Returns `null` (application layer translates to `TableGroupNotFoundError`) |
| Unique constraint violation | Prisma throws `PrismaClientKnownRequestError` with code P2002 |
| Foreign key violation | Prisma throws `PrismaClientKnownRequestError` with code P2003 |

## Test Coverage

| Test File | Tests | Type |
|---|---|---|
| `tests/infrastructure.spec.ts` | 12 | Factory + Repository unit tests |

### Factory Tests
- Creates new group with all fields
- Defaults `description` to `null`
- Defaults `status` to `active`
- Reconstitutes from stored data
- Reconstitutes with empty members list

### Repository Tests
- `save` creates a record via Prisma
- `update` deletes old members and recreates
- `findById` returns group or null
- `findByIdAndRestaurant` returns scoped group
- `findByRestaurantId` returns all groups
- `findByFilters` passes status filter
- `findActiveGroupTableIds` returns active table IDs
- `findActiveGroupByTableId` returns group or null

## Files

| File | Description |
|---|---|
| `infrastructure/repositories/ConcreteTableGroupFactory.ts` | Domain factory implementation |
| `infrastructure/repositories/PrismaTableGroupRepository.ts` | Prisma repository implementation |
| `infrastructure/repositories/index.ts` | Barrel exports |
| `infrastructure/di/index.ts` | DI factory functions |
| `prisma/schema.prisma` | Updated Prisma models (lines 696-733) |
| `prisma/migrations/20260712030000_refactor_table_groups/migration.sql` | Migration SQL |
