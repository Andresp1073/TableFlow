# Table Group Domain (Phase 11.6.1)

## Overview
The Table Group domain models the grouping of physical tables for larger parties. A table group is an aggregate root composed of member tables. Capacity is never persisted — it is computed at runtime from member table capacities.

## Value Objects

| VO | Description | Validation |
|---|---|---|
| `TableGroupId` | UUID identity for aggregate | Valid UUID format |
| `TableGroupName` | Display name (1–100 chars) | Trimmed, case-insensitive equality |
| `TableGroupStatus` | FSM: active → reserved/occupied/released/archived | Transition matrix |
| `DisplayOrder` | Sort order (0–9999) | Integer, non-negative |

## Aggregate: `TableGroup`

```
TableGroup {
  id: TableGroupId
  restaurantId: string
  name: TableGroupName
  description: string | null
  status: TableGroupStatus
  isActive: boolean
  createdBy: string
  members: TableGroupMember[]
  createdAt: Date
  updatedAt: Date
  releasedAt: Date | null
}
```

Key design decisions:
- `capacity` is **not stored** — computed by `GroupCapacityCalculator`
- `description` is optional free text (new)
- `isActive` supports soft deactivation (new)
- `id` is type-safe `TableGroupId` (not raw string)

## Child Entity: `TableGroupMember`

```
TableGroupMember {
  tableId: string          /* identity within aggregate */
  displayOrder: DisplayOrder
  joinedAt: Date
}
```

- `tableGroupId` removed — implied by aggregate parent
- `DisplayOrder` replaces raw `number` for type safety
- `joinedAt` tracks when table joined (replaces `createdAt`)

## Domain Services

### `TableGroupingPolicy` (injectable)
- `validateMinimumMembers()` — requires ≥ 2 tables
- `validateNoDuplicateTables()` — no repeated tableId
- `validateSameRestaurant()` — all tables share restaurantId
- `validateNoArchivedTables()` — archived tables cannot be grouped
- `validateTablesNotInActiveGroup()` — no table may already belong to an active group
- `validateNotTerminal()` — released/archived groups cannot be modified

### `GroupCapacityCalculator`
- `calculate(tables: TableCapacitySource[])` — sums `maximumCapacity.value` from each member

## Domain Errors (typed)

| Error | When thrown |
|---|---|
| `TableGroupAlreadyExistsError` | Duplicate group name in restaurant |
| `InvalidTableGroupError` | General validation failure (archived table, terminal state, etc.) |
| `DuplicateTableInGroupError` | Same table appears > once in member list |
| `InsufficientTablesError` | < 2 tables provided |
| `InvalidRestaurantGroupError` | Table belongs to different restaurant |

## Domain Events (prepared, not published)
- `TableGroupCreated` — id, restaurantId, name, createdBy
- `TableGroupUpdated` — id, restaurantId, name, updatedBy (new)
- `TableGroupReleased` — id, restaurantId, name, releasedBy

Events are not yet connected to an event bus; they are emitted through the application layer.
