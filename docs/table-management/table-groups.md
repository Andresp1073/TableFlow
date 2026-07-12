# Table Groups (Phase 11.6 — Merge / Split)

## Purpose

Allow restaurant staff to temporarily group 2+ physical tables into a single logical group (merge) and later release them back (split) without modifying the underlying `RestaurantTable` entity.

## Architecture

```
Restaurant
  └─ TableGroup (Aggregate Root)
       └─ TableGroupMember[] (Child Entities)
```

Table Groups are a separate aggregate. The `Table` entity is **not modified**.

## Domain Model

### Value Objects

| VO | Fields | Validation |
|----|--------|------------|
| `TableGroupName` | `value: string` | 1–100 chars, trimmed |
| `TableGroupStatus` | `value: "active" \| "reserved" \| "occupied" \| "released" \| "archived"` | Transition matrix |
| `TableGroupCapacity` | `value: number` | Integer, 0–9999 |

### Status Transitions

```
                ┌─────────┐
        ┌──────→│ Active  │←──────┐
        │       └────┬────┘       │
        │            │            │
        │     ┌──────┴──────┐     │
        │     │   Reserved  │     │
        │     └──────┬──────┘     │
        │            │            │
        │     ┌──────┴──────┐     │
        │     │  Occupied   │     │
        │     └──────┬──────┘     │
        │            │            │
        │     ┌──────┴──────┐     │
        └─────│  Released   │─────┘
              └──────┬──────┘
                     │
              ┌──────┴──────┐
              │  Archived   │ (terminal)
              └─────────────┘
```

- `released` and `archived` are terminal states
- After `release`, tables become individually available again

### Aggregate: `TableGroup`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | UUID |
| `restaurantId` | `string` | Parent restaurant |
| `name` | `TableGroupName` | Human-readable label |
| `status` | `TableGroupStatus` | Current lifecycle state |
| `capacity` | `TableGroupCapacity` | Sum of all member tables' maxCapacity |
| `createdBy` | `string` | User UUID who created the group |
| `members` | `TableGroupMember[]` | Member tables |
| `createdAt` | `Date` | Creation timestamp |
| `updatedAt` | `Date` | Last update timestamp |
| `releasedAt` | `Date \| null` | When the group was released |

### Child Entity: `TableGroupMember`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | UUID |
| `tableGroupId` | `string` | Parent group FK |
| `tableId` | `string` | Logical reference to RestaurantTable |
| `order` | `number` | Display order within the group |

## Domain Rules (`TableGroupRules`)

| Rule | Validation | Error |
|------|-----------|-------|
| Minimum 2 tables | `validateMinimumMembers()` | "A table group must contain at least 2 tables" |
| No duplicate tables | `validateNoDuplicateTables()` | "Duplicate table '$id' in group members" |
| Same restaurant | `validateAllTablesSameRestaurant()` | "Table '$id' does not belong to restaurant '$rid'" |
| Not in another active group | `validateTablesNotInActiveGroup()` | "Table '$id' is already part of an active group" |
| Valid table status | `validateTablesStatus()` | "Table '$id' has status 'occupied' and cannot be grouped" |
| Capacity calculation | N/A (auto-sum) | N/A |
| Not terminal | `validateNotTerminal()` | "Cannot modify a table group in '$state' state" |

## REST API

All endpoints are mounted under `/api/v1/restaurants/:id/`.

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| `POST` | `/table-groups` | Create a new table group | `restaurants.table-groups.create` |
| `GET` | `/table-groups` | List table groups | `restaurants.table-groups.read` |
| `GET` | `/table-groups/:groupId` | Get a single group | `restaurants.table-groups.read` |
| `PATCH` | `/table-groups/:groupId/release` | Release a group | `restaurants.table-groups.release` |

### `POST /table-groups`

**Request:**
```json
{
  "name": "Table 3+4 Merged",
  "tableIds": [
    "uuid-of-table-3",
    "uuid-of-table-4"
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "restaurantId": "uuid",
    "name": "Table 3+4 Merged",
    "status": "active",
    "capacity": 8,
    "createdBy": "user-uuid",
    "members": [
      { "id": "m-uuid", "tableId": "uuid-of-table-3", "order": 1 },
      { "id": "m-uuid", "tableId": "uuid-of-table-4", "order": 2 }
    ],
    "createdAt": "2026-07-12T10:00:00.000Z",
    "updatedAt": "2026-07-12T10:00:00.000Z",
    "releasedAt": null
  },
  "message": "Table group created successfully"
}
```

### `PATCH /table-groups/:groupId/release`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "restaurantId": "uuid",
    "name": "Table 3+4 Merged",
    "status": "released",
    "capacity": 8,
    "members": [...],
    "releasedAt": "2026-07-12T12:00:00.000Z"
  },
  "message": "Table group released successfully"
}
```

## Availability Integration

When a table belongs to an active group (status `active`, `reserved`, or `occupied`), the `TableGroupEvaluator` in the Availability Engine returns `unavailable` with reason `table_occupied` and metadata including the group ID.

The evaluator is inserted as step 4 in the evaluation chain:
1. Restaurant Status → 2. Business Hours → 3. Calendar Exceptions → **4. Table Group** → 5. Table Active → 6. Dining Area → 7. Table Type → 8. Table Status → 9. Reservation Policy

## Authorization

Three permissions in the `restaurants` module:

| Permission | Risk |
|------------|------|
| `restaurants.table-groups.create` | medium |
| `restaurants.table-groups.read` | low |
| `restaurants.table-groups.release` | medium |

## Audit

All mutating operations are audited:

| Action | Entity Type | Fields Logged |
|--------|-------------|---------------|
| `create` | `table_group` | name, status, capacity, tableCount, tableIds |
| `release` | `table_group` | oldStatus, newStatus, releasedAt |

## Database Schema

### `table_groups`

```sql
CREATE TABLE `table_groups` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `capacity` INT NOT NULL DEFAULT 0,
    `createdBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `releasedAt` DATETIME(3) NULL,
    PRIMARY KEY (`id`),
    INDEX `table_groups_restaurantId_idx` (`restaurantId`),
    INDEX `table_groups_restaurantId_status_idx` (`restaurantId`, `status`)
) ENGINE=InnoDB;
```

### `table_group_members`

```sql
CREATE TABLE `table_group_members` (
    `id` CHAR(36) NOT NULL,
    `tableGroupId` CHAR(36) NOT NULL,
    `tableId` CHAR(36) NOT NULL,
    `order` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `table_group_members_tableGroupId_tableId_key` (`tableGroupId`, `tableId`),
    INDEX `table_group_members_tableId_idx` (`tableId`),
    INDEX `table_group_members_tableGroupId_idx` (`tableGroupId`)
) ENGINE=InnoDB;
```

## Testing

```
npx vitest run src/modules/restaurant/table-groups/tests/table-groups.spec.ts
npx vitest run src/modules/restaurant/tables/tests/availability-engine.spec.ts
```

Tests cover:
- All 5 status values and transitions
- Name validation (empty, length, case-insensitive equals)
- Capacity validation (negative, non-integer)
- Factory `create()` vs `reconstitute()`
- All 7 domain rules (min members, duplicates, same restaurant, active group check, status check, terminal check)
- TableGroupEvaluator in availability engine
