# Table Types

## Overview

Table Types define reusable characteristics shared by multiple physical tables. They serve as templates or classifications (Standard, VIP, Booth, Bar, Outdoor, etc.) that describe the common attributes of a group of tables without defining any specific physical table instance.

## Architecture

```
Restaurant
    │
    ▼
TableType  ────────────────────┐  (reusable classification)
    │                          │
    │                          │
    ▼                          ▼
Physical Table (future)    Physical Table (future)
```

Table Types belong to a Restaurant (Organization). Each restaurant can define its own set of table types. Physical tables (to be implemented in a future phase) will reference a Table Type to inherit its default characteristics.

## Domain Model

### TableType Entity

| Attribute        | Type                  | Description                                    |
|-----------------|-----------------------|------------------------------------------------|
| id              | UUID (string)         | Primary key                                    |
| restaurantId    | UUID (string)         | Foreign key to Organization                    |
| name            | TableTypeName (VO)    | Display name (unique per restaurant)           |
| code            | TableTypeCode (VO)    | Machine-readable code (unique per restaurant)  |
| description     | string (nullable)     | Optional description                           |
| defaultCapacity | TableCapacity (VO)    | Default party size this type accommodates      |
| minimumCapacity | TableCapacity (VO)    | Minimum party size                             |
| maximumCapacity | TableCapacity (VO)    | Maximum party size                             |
| shape           | TableShape (VO)       | Physical shape of the table                    |
| isReservable    | boolean               | Whether tables of this type can be reserved    |
| displayOrder    | DisplayOrder (VO)     | Sort order for UI presentation                 |
| status          | TableTypeStatus (VO)  | Active or archived                             |
| metadata        | JSON (nullable)       | Extensible custom data                         |
| createdAt       | DateTime              | Creation timestamp                             |
| updatedAt       | DateTime              | Last update timestamp                          |

### Value Objects

- **TableTypeName**: Non-empty, max 100 chars, case-insensitive equality
- **TableTypeCode**: Uppercase alphanumeric with underscores/hyphens, max 30 chars
- **TableCapacity**: Integer 1-999
- **TableShape**: Enum: square, rectangle, round, oval, custom
- **DisplayOrder**: Integer 0-9999
- **TableTypeStatus**: Active or archived (soft-delete)

### Supported Shapes

| Shape     | Description                          |
|-----------|--------------------------------------|
| Square    | Square-shaped tables                 |
| Rectangle | Rectangular tables (standard)        |
| Round     | Round/circular tables                |
| Oval      | Oval-shaped tables                   |
| Custom    | Custom shape (extensible for future) |

## Business Rules

1. **Unique name per restaurant**: No two table types in the same restaurant can have the same name
2. **Unique code per restaurant**: No two table types in the same restaurant can have the same code
3. **Capacity range validation**: `minimumCapacity <= defaultCapacity <= maximumCapacity`
4. **Display order uniqueness**: Enforced at application layer within each restaurant
5. **Soft delete**: Table types are archived, never hard-deleted
6. **Status transitions**: Active → Archived (one-way). Archived types cannot be modified

## Relationship with Physical Tables (Future)

When Physical Tables are implemented in a later phase, each physical table will reference a Table Type:

```
TableType (1) ──── (N) Physical Table
```

The Table Type provides default values for:
- Default/minimum/maximum capacity
- Shape
- Is reservable flag
- Metadata structure

Physical tables may override these defaults as needed.

## REST API

### Endpoints

| Method | Path                                                        | Permission          | Description              |
|--------|-------------------------------------------------------------|---------------------|--------------------------|
| POST   | `/api/v1/restaurants/:restaurantId/table-types`             | `table-types.create`| Create a new table type  |
| GET    | `/api/v1/restaurants/:restaurantId/table-types`             | `table-types.read`  | List table types         |
| GET    | `/api/v1/restaurants/:restaurantId/table-types/:id`         | `table-types.read`  | Get table type by ID     |
| PUT    | `/api/v1/restaurants/:restaurantId/table-types/:id`         | `table-types.update`| Update a table type      |
| PATCH  | `/api/v1/restaurants/:restaurantId/table-types/:id/archive` | `table-types.archive`| Archive a table type     |

### Request/Response Examples

#### Create Table Type

```json
POST /api/v1/restaurants/123e4567-e89b-12d3-a456-426614174000/table-types
Authorization: Bearer <token>

{
  "name": "VIP Room",
  "code": "VIP",
  "description": "Private VIP dining room",
  "defaultCapacity": 8,
  "minimumCapacity": 2,
  "maximumCapacity": 12,
  "shape": "round",
  "isReservable": true,
  "displayOrder": 1,
  "metadata": { "hasCurtains": true }
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174000",
    "restaurantId": "123e4567-e89b-12d3-a456-426614174000",
    "name": "VIP Room",
    "code": "VIP",
    "description": "Private VIP dining room",
    "defaultCapacity": 8,
    "minimumCapacity": 2,
    "maximumCapacity": 12,
    "shape": "round",
    "isReservable": true,
    "displayOrder": 1,
    "status": "active",
    "metadata": { "hasCurtains": true },
    "createdAt": "2026-07-12T10:00:00.000Z",
    "updatedAt": "2026-07-12T10:00:00.000Z"
  },
  "message": "Table type created successfully"
}
```

#### List Table Types

```json
GET /api/v1/restaurants/123e4567-e89b-12d3-a456-426614174000/table-types
Authorization: Bearer <token>
```

Response (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "restaurantId": "...",
      "name": "VIP Room",
      "code": "VIP",
      "defaultCapacity": 8,
      "minimumCapacity": 2,
      "maximumCapacity": 12,
      "shape": "round",
      "isReservable": true,
      "displayOrder": 1,
      "status": "active",
      "metadata": null,
      "createdAt": "2026-07-12T10:00:00.000Z",
      "updatedAt": "2026-07-12T10:00:00.000Z"
    }
  ]
}
```

#### Update Table Type

```json
PUT /api/v1/restaurants/123e4567-e89b-12d3-a456-426614174000/table-types/456e7890-...
Authorization: Bearer <token>

{
  "name": "Premium VIP",
  "code": "PVIP",
  "defaultCapacity": 10,
  "minimumCapacity": 4,
  "maximumCapacity": 16,
  "shape": "oval",
  "isReservable": true,
  "displayOrder": 0
}
```

#### Archive Table Type

```json
PATCH /api/v1/restaurants/123e4567-e89b-12d3-a456-426614174000/table-types/456e7890-.../archive
Authorization: Bearer <token>
```

Response (200):
```json
{
  "success": true,
  "data": { "...", "status": "archived" },
  "message": "Table type archived successfully"
}
```

## Validation Rules

| Field            | Rules                                          |
|------------------|------------------------------------------------|
| name             | Required, 1-100 characters                     |
| code             | Required, 1-30 characters, uppercase regex     |
| defaultCapacity  | Required, integer 1-999                        |
| minimumCapacity  | Required, integer 1-999                        |
| maximumCapacity  | Required, integer 1-999                        |
| shape            | Required, enum: square/rectangle/round/oval/custom |
| description      | Optional, max 500 characters                   |
| displayOrder     | Optional, integer 0-9999                       |
| isReservable     | Optional, boolean, defaults to true            |
| metadata         | Optional, arbitrary JSON object                |

## Permissions

| Code                   | Description                         |
|------------------------|-------------------------------------|
| `table-types.create`   | Create a new table type definition  |
| `table-types.read`     | View table type definitions         |
| `table-types.update`   | Modify table type configuration     |
| `table-types.archive`  | Archive (soft-delete) a table type  |

## Audit

All mutations (create, update, archive) are recorded in the audit log via the Audit Module with:
- `module`: "table"
- `entityType`: "table_type"

## Examples

### Standard Table Type

```json
{
  "name": "Standard",
  "code": "STD",
  "defaultCapacity": 4,
  "minimumCapacity": 1,
  "maximumCapacity": 8,
  "shape": "rectangle",
  "isReservable": true,
  "displayOrder": 0
}
```

### Bar Table Type

```json
{
  "name": "Bar",
  "code": "BAR",
  "defaultCapacity": 2,
  "minimumCapacity": 1,
  "maximumCapacity": 4,
  "shape": "round",
  "isReservable": false,
  "displayOrder": 1
}
```

### Booth Table Type

```json
{
  "name": "Booth",
  "code": "BOOTH",
  "description": "Comfortable booth seating",
  "defaultCapacity": 4,
  "minimumCapacity": 2,
  "maximumCapacity": 6,
  "shape": "custom",
  "isReservable": true,
  "displayOrder": 2
}
```
