# Dining Areas

## Overview

Dining Areas represent the physical zones or sections inside a restaurant (e.g., Main Hall, Terrace, Garden, VIP Room, Bar, Rooftop). They sit between the Restaurant aggregate and (future) Tables:

```
Restaurant
    ↓
DiningArea   ← you are here
    ↓
Table        ← future
```

## Architecture

```
src/modules/restaurant/dining-areas/
  domain/
    models/
      DiningArea.ts         — Aggregate interface
      DiningAreaName.ts     — Value Object: max 100 chars
      DiningAreaCode.ts     — Value Object: max 30 chars, uppercase, alphanumeric
      DisplayOrder.ts       — Value Object: 0–9999 integer
      DiningAreaStatus.ts   — Value Object: active | archived
    events/
      DiningAreaEvents.ts   — DiningAreaCreated, DiningAreaUpdated, DiningAreaArchived
    repositories/
      DiningAreaRepository.ts  — Repository interface
      DiningAreaFactory.ts     — Factory interface (create + reconstitute)
    services/
      DiningAreaRules.ts      — Domain rules (status transitions, archived guard)
  application/
    commands/
      CreateDiningAreaCommand.ts
      UpdateDiningAreaCommand.ts
      ArchiveDiningAreaCommand.ts
    queries/
      GetDiningAreaQuery.ts
      ListDiningAreasQuery.ts
    dto/
      DiningAreaDTO.ts
      DiningAreaMapper.ts
    services/
      DiningAreaApplicationService.ts  — Orchestrates auth + rules + persistence + events + audit
  infrastructure/
    repositories/
      PrismaDiningAreaRepository.ts
      ConcreteDiningAreaFactory.ts
  presentation/
    controllers/
      DiningAreaController.ts
    routes/
      dining-areas.routes.ts
    validation/
      dining-areas.validation.ts
  errors/
    DiningAreaNotFoundError.ts
    DiningAreaDuplicateNameError.ts
    DiningAreaDuplicateCodeError.ts
    DiningAreaStatusTransitionError.ts
```

## Business Rules

### Name & Code
- Name: required, max 100 chars, unique per restaurant
- Code: required, max 30 chars, uppercase alphanumeric with `_` and `-`, unique per restaurant
- Both are case-insensitive for uniqueness checks

### Status
| Status | Description |
|--------|-------------|
| `active` | Default on creation. Area is open and usable |
| `archived` | Soft-delete. Area is hidden from active views |

**Transitions:** `active` → `archived` only. Archived areas cannot be modified or reactivated.

### Display Order
- Integer 0–9999, defaults to next available value
- Used for ordering the areas in UI

## API Endpoints

All endpoints are under `/api/v1/restaurants/{restaurantId}`.

### `POST /dining-areas`
Create a new dining area.  
Permission: `restaurants.dining-areas.create`  
Body: `{ name, code, description?, displayOrder?, isReservable? }`

### `GET /dining-areas`
List dining areas (optional `?status=active|archived` filter).  
Permission: `restaurants.dining-areas.read`

### `GET /dining-areas/{diningAreaId}`
Get a single dining area by ID.  
Permission: `restaurants.dining-areas.read`

### `PUT /dining-areas/{diningAreaId}`
Update a dining area (name, code, description, displayOrder, isReservable).  
Permission: `restaurants.dining-areas.update`

### `PATCH /dining-areas/{diningAreaId}/archive`
Archive (soft-delete) a dining area.  
Permission: `restaurants.dining-areas.archive`

## Permissions

| Code | Description |
|------|-------------|
| `restaurants.dining-areas.create` | Create dining areas |
| `restaurants.dining-areas.read` | View dining areas |
| `restaurants.dining-areas.update` | Update dining areas |
| `restaurants.dining-areas.archive` | Archive dining areas |

## Audit Integration

Every create, update, and archive action is recorded via the generic `AuditService`:
- **create**: logs `action: "create"` with `newValues`
- **update**: logs `action: "update"` with `oldValues` and `newValues` diff
- **archive**: logs `action: "archive"` with status change

All entries use `module: "restaurant"`, `entityType: "dining_area"`.

## Future Relationship with Tables

In the next phase, a `DiningArea` will have many `Table` instances:

```ruby
Restaurant
    ↓
DiningArea  ← currently implemented
    ↓
Table       ← future: each table belongs_to a DiningArea
```

The `DiningArea` model already uses `restaurantId` (not `branchId`), maintaining the "Restaurant → Area → Table" hierarchy at the organization level. The existing `TableZone` model (branch-scoped) will remain for branch-level table grouping.
