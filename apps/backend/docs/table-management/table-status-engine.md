# Table Status Engine

## Overview

The Table Status Engine implements a **Finite State Machine (FSM)** for managing the lifecycle of physical tables in the restaurant. It enforces valid state transitions, prevents invalid operations, and provides audit logging for every status change.

## States

| State | Description | Terminal |
|-------|-------------|----------|
| `available` | Table is clean, unoccupied, and ready for guests | No |
| `reserved` | Table has been reserved for upcoming guests | No |
| `occupied` | Table is currently in use by guests | No |
| `cleaning` | Table is being cleaned after guest departure | No |
| `blocked` | Table is temporarily blocked (manager decision, incident, etc.) | No |
| `out_of_service` | Table is out of service but may be returned to service | No |
| `maintenance` | Table requires maintenance/repair | No |
| `archived` | Table is permanently decommissioned (terminal) | **Yes** |

## State Machine Diagram

```
                    ┌─────────────┐
                    │  available  │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┬──────────────┬──────────────┐
            ▼              ▼              ▼              ▼              ▼
      ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
      │ reserved │  │ occupied │  │ blocked  │  │maintenanc│  │ cleaning │
      └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
           │              │             │             │             │
           ├──────────┐   │             │             │             │
           ▼          ▼   ▼             │             │             │
      ┌──────────┐ ┌──────────┐         │             │             │
      │ occupied │ │available │         │             │             │
      └──────────┘ └──────────┘         │             │             │
           │                            │             │             │
           ▼                            ▼             │             │
      ┌──────────┐                ┌──────────┐        │             │
      │ cleaning │                │available │        │             │
      └──────────┘                └──────────┘        │             │
           │                                          │             │
           ▼                                          ▼             ▼
      ┌──────────┐                              ┌──────────┐
      │available │                              │available │
      └──────────┘                              └──────────┘

      ┌───────────────┐
      │ out_of_service │─────► available
      └───────────────┘
              │
              ▼
      ┌──────────────┐
      │ maintenance  │─────► available
      └──────────────┘

      ┌──────────┐
      │ archived │ (terminal — no outgoing transitions)
      └──────────┘
```

## Transition Matrix

| From \ To | available | reserved | occupied | cleaning | blocked | out_of_service | maintenance | archived |
|-----------|-----------|----------|----------|----------|---------|----------------|-------------|----------|
| available | - | ✅ | ✅ | ✅ | ✅ | - | ✅ | ❌ |
| reserved | ✅ | - | ✅ | ❌ | ✅ | - | ❌ | ❌ |
| occupied | ❌ | ❌ | - | ✅ | ✅ | - | ❌ | ❌ |
| cleaning | ✅ | ❌ | ❌ | - | ❌ | - | ❌ | ❌ |
| blocked | ✅ | ❌ | ❌ | ❌ | - | - | ❌ | ❌ |
| out_of_service | ✅ | ❌ | ❌ | ❌ | ❌ | - | ✅ | ❌ |
| maintenance | ✅ | ❌ | ❌ | ❌ | ❌ | - | - | ❌ |
| archived | ❌ | ❌ | ❌ | ❌ | ❌ | - | ❌ | - |

Legend: ✅ = allowed, ❌ = not allowed, - = same state (no-op)

## Business Rules

### General Rules
1. **No transitions from `archived`**: Archived is a terminal state. Once a table is archived, its status cannot be changed.
2. **Deleted table protection**: Deleted (soft-deleted) tables cannot have their status changed.
3. **Same-state is allowed**: Changing to the current status is a no-op (always allowed).
4. **Audit logging**: Every status transition is recorded in the audit log with previous status, new status, performer, and optional reason.

### Status-specific Rules
1. **available → reserved**: Only `available` tables can be reserved.
2. **available → occupied**: Walk-in guests can be seated directly at available tables.
3. **occupied → cleaning**: After guests leave, table must transition to cleaning.
4. **cleaning → available**: After cleaning, table returns to available.
5. **blocked → available**: Manager can unblock a table.
6. **maintenance → available**: After repair, table returns to service.
7. **out_of_service → available/maintenance**: Can be returned to service or scheduled for maintenance.
8. **occupied → blocked**: Only available for incident management (not to cleaning).

### What Cannot Happen
- Table cannot skip cleaning after occupancy
- Reserved table cannot go directly to cleaning
- Archived table cannot be modified (use the archive endpoint for permanent decommissioning)
- Cleaning table cannot go directly to occupied (must go through available)

## API Endpoints

### Change Table Status

```
PATCH /api/v1/restaurants/:restaurantId/tables/:tableId/status
```

**Authorization**: `tables.status.update`

**Request Body**:
```json
{
  "status": "occupied",
  "reason": "Walk-in guest seated"  // optional
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tableNumber": "T1",
    "previousStatus": "available",
    "newStatus": "occupied",
    "updatedAt": "2026-07-12T00:00:00.000Z"
  },
  "message": "Table status changed successfully"
}
```

**Errors**:
- `400` — Invalid request body (missing status, invalid status value)
- `404` — Table not found
- `422` — Invalid transition or terminal state
- `410` — Table is deleted

### Get Available Transitions

```
GET /api/v1/restaurants/:restaurantId/tables/:tableId/transitions
```

**Authorization**: `tables.read`

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "status": "available",
    "allowedTransitions": ["reserved", "occupied", "blocked", "maintenance", "cleaning"]
  }
}
```

## Errors

| Error | HTTP Code | Code | Description |
|-------|-----------|------|-------------|
| Invalid status value | 422 | - | Status is not in the allowed enum |
| Invalid transition | 422 | `table.invalid_status_transition` | Transition not allowed by FSM |
| Terminal state | 422 | - | Table is archived and cannot be modified |
| Deleted table | 410 | `table.deleted` | Table has been soft-deleted |
| Not found | 404 | - | Table ID does not exist |

## Permissions

| Permission | Description |
|------------|-------------|
| `tables.status.update` | Change table status via the status engine |
| `tables.read` | View table details and available transitions |

## Architecture

### Domain Layer

| Class | Responsibility |
|-------|----------------|
| `TableStateMachine` | Core FSM: defines states, transitions, and validates moves |
| `TableTransitionValidator` | Validates individual transitions with error messages |
| `TableStatusPolicy` | Business rules: who can be reserved, merged, served, etc. |
| `TableStatusEngine` | Orchestrator: combines FSM + validator + policy for status changes |

### Application Layer

| Method | Description |
|--------|-------------|
| `changeStatus(command, auth, metadata)` | Execute a status transition with authorization, audit, and event publishing |
| `getAvailableTransitions(query, auth)` | Get allowed transitions from current state |

### Event

`TableStatusChanged` is emitted on every status change with:
- `tableId`, `restaurantId`, `tableNumber`
- `previousStatus`, `newStatus`
- `performedBy`, `reason`
