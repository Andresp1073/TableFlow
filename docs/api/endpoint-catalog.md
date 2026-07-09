# Endpoint Catalog

**Last updated:** 2026-07-04

## How to Read This Catalog

Each endpoint includes:

| Field | Description |
|-------|-------------|
| **Method** | HTTP verb |
| **URL** | Full path relative to `/api/v1` |
| **Purpose** | What the endpoint does |
| **Auth** | Authentication required |
| **Permission** | RBAC permission required |
| **Idempotent** | Supports `Idempotency-Key` header |
| **Request** | Path params, query params, headers, body |
| **Response** | Status codes, body structure |
| **Errors** | Possible error codes |
| **Validation** | Field-level validation rules |
| **Business Rules** | Domain logic enforced |
| **Example** | Sample request/response |

---

## 1. Users

### GET /api/v1/users

**Purpose:** List users within the organization.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `users.read` |
| **Idempotent** | ✅ (GET) |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | integer | ❌ | Page number (default: 1) |
| `pageSize` | integer | ❌ | Items per page (default: 20, max: 100) |
| `sortBy` | string | ❌ | `createdAt`, `email`, `firstName`, `lastName` |
| `sortDirection` | string | ❌ | `ASC`, `DESC` |
| `q` | string | ❌ | Search query (searches email, firstName, lastName) |
| `isActive` | boolean | ❌ | Filter by active status |
| `roleId` | string (UUID) | ❌ | Filter by role |
| `branchId` | string (UUID) | ❌ | Filter by branch assignment |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@restaurant.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "isActive": true,
      "isVerified": true,
      "lastLoginAt": "2026-07-03T18:00:00.000Z",
      "roles": [
        { "roleId": "uuid", "roleName": "receptionist", "branchId": "uuid" }
      ],
      "createdAt": "2026-06-01T10:00:00.000Z",
      "updatedAt": "2026-07-03T18:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 15, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false, "requestId": "req-uuid-v4" },
  "error": null
}
```

**Errors:** `401`, `403`

---

### POST /api/v1/users

**Purpose:** Create a new staff user.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `users.create` |
| **Idempotent** | ✅ |

**Request Body:**

```json
{
  "email": "newstaff@restaurant.com",
  "password": "TempPass123!",
  "firstName": "Mark",
  "lastName": "Johnson",
  "phone": "+14155559876",
  "roleIds": [
    { "roleId": "uuid", "branchId": "uuid" }
  ]
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email, unique |
| `password` | string | ✅ | Min 12 chars, complexity rules |
| `firstName` | string | ✅ | 1–100 chars |
| `lastName` | string | ✅ | 1–100 chars |
| `phone` | string | ❌ | E.164 format |
| `roleIds` | array | ❌ | Array of role assignments |

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newstaff@restaurant.com",
    "firstName": "Mark",
    "lastName": "Johnson",
    "isActive": true,
    "isVerified": false,
    "createdAt": "2026-07-04T10:00:00.000Z"
  },
  "meta": { "requestId": "req-uuid-v4", "location": "/api/v1/users/uuid" },
  "error": null
}
```

**Errors:** `400`, `401`, `403`, `409` (duplicate email)

---

### GET /api/v1/users/{id}

**Purpose:** Get a single user's details.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `users.read` |
| **Idempotent** | ✅ (GET) |

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | User ID |

**Response:** `200 OK` — Same structure as list item, plus `employeeIds` array.

**Errors:** `401`, `403`, `404`

---

### PATCH /api/v1/users/{id}

**Purpose:** Update a user's profile.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `users.update` |
| **Idempotent** | ✅ |

**Request Body:** (all fields optional)

```json
{
  "firstName": "Marky",
  "lastName": "Johnson-Smith",
  "phone": "+14155559877",
  "isActive": false
}
```

| Field | Type | Validation |
|-------|------|------------|
| `firstName` | string | 1–100 chars |
| `lastName` | string | 1–100 chars |
| `phone` | string | E.164 format |
| `isActive` | boolean | — |

**Response:** `200 OK`

**Errors:** `400`, `401`, `403`, `404`

**Business Rules:**
- Cannot deactivate yourself
- Cannot deactivate the last admin in an org

---

### DELETE /api/v1/users/{id}

**Purpose:** Soft-delete a user account.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `users.delete` |
| **Idempotent** | ✅ (DELETE) |

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | User ID |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `permanent` | boolean | Hard delete (admin only, default: false) |

**Response:** `204 No Content`

**Errors:** `401`, `403`, `404`, `409` (user has active reservations)

**Business Rules:**
- Soft delete by default (sets `deleted_at`)
- Cannot delete yourself
- Cannot delete the last admin

---

## 2. Roles

### GET /api/v1/roles

**Purpose:** List all roles in the organization.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `roles.read` |
| **Idempotent** | ✅ (GET) |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "restaurant_admin",
      "description": "Full access to all branch operations",
      "isSystem": true,
      "permissions": ["reservations.*", "customers.*", "users.*", "settings.*"],
      "createdAt": "2026-06-01T10:00:00.000Z"
    }
  ],
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

**Errors:** `401`, `403`

---

### GET /api/v1/roles/{id}

**Purpose:** Get a single role's details.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `roles.read` |
| **Idempotent** | ✅ (GET) |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "restaurant_admin",
    "description": "Full access to all branch operations",
    "isSystem": true,
    "permissions": ["reservations.*", "customers.*", "users.*", "settings.*"],
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-07-04T10:00:00.000Z"
  },
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

**Errors:** `401`, `403`, `404`

---

### POST /api/v1/roles

**Purpose:** Create a custom role.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `roles.create` |
| **Idempotent** | ✅ |

**Request Body:**

```json
{
  "name": "floor_manager",
  "description": "Manages floor operations",
  "permissionIds": ["uuid-1", "uuid-2"]
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | ✅ | 1–100 chars, unique, kebab-case |
| `description` | string | ❌ | Max 500 chars |
| `permissionIds` | UUID[] | ❌ | Must reference existing permissions |

**Response:** `201 Created`

**Errors:** `400`, `401`, `403`, `409` (duplicate name)

---

### PUT /api/v1/roles/{id}

**Purpose:** Replace a role's permissions.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `roles.update` |
| **Idempotent** | ✅ |

**Request Body:**

```json
{
  "name": "floor_manager",
  "description": "Manages floor operations and staff",
  "permissionIds": ["uuid-1", "uuid-3", "uuid-4"]
}
```

**Response:** `200 OK`

**Errors:** `400`, `401`, `403`, `404`

**Business Rules:**
- System roles (`isSystem: true`) cannot be modified

---

### DELETE /api/v1/roles/{id}

**Purpose:** Delete a custom role.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `roles.delete` |
| **Idempotent** | ✅ (DELETE) |

**Response:** `204 No Content`

**Errors:** `401`, `403`, `404`, `409` (role in use)

**Business Rules:**
- System roles cannot be deleted
- Cannot delete a role that is assigned to active users

---

## 3. Permissions

### GET /api/v1/permissions

**Purpose:** List all available permissions (read-only catalog).

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `roles.read` |
| **Idempotent** | ✅ (GET) |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "reservations.create",
      "description": "Create new reservations",
      "module": "reservations",
      "riskLevel": "medium"
    }
  ],
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

**Errors:** `401`, `403`

---

## 4. Restaurants (Organizations)

### GET /api/v1/organizations

**Purpose:** List organizations (super admin only).

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | System admin only |
| **Idempotent** | ✅ (GET) |

**Response:** `200 OK` — Paginated list of organizations.

---

### GET /api/v1/organizations/{id}

**Purpose:** Get organization details.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | Within own org: implied; cross-org: `admin` |
| **Idempotent** | ✅ (GET) |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "La Trattoria Group",
    "email": "contact@latrattoria.com",
    "phone": "+14155551234",
    "address": "123 Main St, New York, NY 10001",
    "logoUrl": "https://cdn.tableflow.com/logos/org-uuid.png",
    "timezone": "America/New_York",
    "branchCount": 5,
    "totalStaff": 48,
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-07-04T10:00:00.000Z"
  },
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

**Errors:** `401`, `403`, `404`

---

### PATCH /api/v1/organizations/{id}

**Purpose:** Update organization settings.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `settings.update` |
| **Idempotent** | ✅ |

**Request Body:** (all fields optional)

```json
{
  "name": "La Trattoria Group Inc.",
  "email": "contact@latrattoriagroup.com",
  "phone": "+14155559876",
  "address": "456 Oak Ave, New York, NY 10002",
  "logoUrl": "https://cdn.tableflow.com/logos/new-logo.png",
  "timezone": "America/New_York"
}
```

**Response:** `200 OK`

**Errors:** `400`, `401`, `403`, `404`

---

## 5. Branches

### GET /api/v1/branches

**Purpose:** List branches within the user's organization.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `branches.read` |
| **Idempotent** | ✅ (GET) |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | integer | ❌ | Page number |
| `pageSize` | integer | ❌ | Items per page |
| `sortBy` | string | ❌ | `name`, `createdAt`, `cuisineType` |
| `sortDirection` | string | ❌ | `ASC`, `DESC` |
| `q` | string | ❌ | Search by name, address, cuisine |
| `cuisineType` | string | ❌ | Filter by cuisine |
| `isOnlineReservationEnabled` | boolean | ❌ | Filter by online booking toggle |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organizationId": "uuid",
      "name": "La Trattoria Downtown",
      "address": "123 Main St, New York, NY 10001",
      "phone": "+14155551234",
      "email": "downtown@latrattoria.com",
      "timezone": "America/New_York",
      "cuisineType": "Italian",
      "averageDiningDuration": 90,
      "maxAdvanceBookingDays": 60,
      "slotInterval": 30,
      "maxPartySize": 20,
      "isOnlineReservationEnabled": true,
      "tableCount": 25,
      "createdAt": "2026-06-01T10:00:00.000Z",
      "updatedAt": "2026-07-04T10:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 5, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false, "requestId": "req-uuid-v4" },
  "error": null
}
```

**Errors:** `401`, `403`

---

### POST /api/v1/branches

**Purpose:** Create a new branch.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `branches.create` |
| **Idempotent** | ✅ |

**Request Body:**

```json
{
  "name": "La Trattoria Uptown",
  "address": "789 Park Ave, New York, NY 10021",
  "phone": "+14155559876",
  "email": "uptown@latrattoria.com",
  "timezone": "America/New_York",
  "cuisineType": "Italian",
  "averageDiningDuration": 90,
  "maxAdvanceBookingDays": 60,
  "slotInterval": 30,
  "maxPartySize": 20,
  "isOnlineReservationEnabled": true
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | ✅ | 1–255 chars, unique within org |
| `address` | string | ✅ | Max 2000 chars |
| `phone` | string | ❌ | E.164 |
| `email` | string | ❌ | Valid email |
| `timezone` | string | ✅ | Valid IANA timezone |
| `cuisineType` | string | ❌ | Max 100 chars |
| `averageDiningDuration` | integer | ❌ | 30–240 minutes |
| `maxAdvanceBookingDays` | integer | ❌ | 1–365 |
| `slotInterval` | integer | ❌ | 15, 30, or 60 |
| `maxPartySize` | integer | ❌ | 1–50 |
| `isOnlineReservationEnabled` | boolean | ❌ | Default: false |

**Response:** `201 Created`

**Errors:** `400`, `401`, `403`, `409` (duplicate name)

---

### GET /api/v1/branches/{id}

**Purpose:** Get branch details with hours and stats.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `branches.read` |
| **Idempotent** | ✅ (GET) |

**Response:** `200 OK` — Full branch object with nested `businessHours` and `holidayHours`.

---

### PUT /api/v1/branches/{id}

**Purpose:** Replace all branch fields.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `branches.update` |
| **Idempotent** | ✅ |

**Response:** `200 OK`

---

### PATCH /api/v1/branches/{id}

**Purpose:** Partial branch update.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `branches.update` |
| **Idempotent** | ✅ |

**Response:** `200 OK`

---

### DELETE /api/v1/branches/{id}

**Purpose:** Soft-delete a branch.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `branches.delete` |
| **Idempotent** | ✅ (DELETE) |

**Response:** `204 No Content`

**Errors:** `401`, `403`, `404`, `409` (has active reservations)

**Business Rules:**
- Cannot delete a branch with upcoming reservations
- Soft delete sets `deleted_at`

---

### GET /api/v1/branches/{id}/business-hours

**Purpose:** Get operating hours for a branch.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `branches.read` |
| **Idempotent** | ✅ (GET) |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    { "dayOfWeek": 1, "openTime": "08:00:00", "closeTime": "22:00:00", "isClosed": false },
    { "dayOfWeek": 2, "openTime": "08:00:00", "closeTime": "22:00:00", "isClosed": false },
    { "dayOfWeek": 6, "openTime": "09:00:00", "closeTime": "23:00:00", "isClosed": false },
    { "dayOfWeek": 7, "openTime": null, "closeTime": null, "isClosed": true }
  ],
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

---

### PUT /api/v1/branches/{id}/business-hours

**Purpose:** Set all 7 days of business hours.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `branches.update` |
| **Idempotent** | ✅ |

**Request Body:** Array of 7 day objects (same structure as response).

**Response:** `200 OK`

**Business Rules:**
- Must provide exactly 7 records (one per day)
- `openTime` must be before `closeTime`
- If `isClosed` is true, `openTime` and `closeTime` must be null

---

### GET /api/v1/branches/{id}/holiday-hours

**Purpose:** List holiday hour overrides.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `branches.read` |
| **Idempotent** | ✅ (GET) |

**Response:** `200 OK` — Paginated list.

---

### POST /api/v1/branches/{id}/holiday-hours

**Purpose:** Add a holiday hour override.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `branches.update` |
| **Idempotent** | ✅ |

**Request Body:**

```json
{
  "date": "2026-12-25",
  "openTime": null,
  "closeTime": null,
  "isClosed": true,
  "description": "Christmas Day"
}
```

**Response:** `201 Created`

---

### DELETE /api/v1/branches/{id}/holiday-hours/{holidayId}

**Purpose:** Remove a holiday hour override.

**Response:** `204 No Content`

---

## 6. Tables

### GET /api/v1/branches/{branchId}/tables

**Purpose:** List tables for a branch.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `tables.read` |
| **Idempotent** | ✅ (GET) |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `isActive` | boolean | Filter by active status |
| `zoneId` | UUID | Filter by zone |
| `minCapacity` | integer | Minimum seat filter |
| `maxCapacity` | integer | Maximum seat filter |
| `q` | string | Search by table number |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "branchId": "uuid",
      "zoneId": "uuid",
      "tableNumber": "T-01",
      "minCapacity": 2,
      "maxCapacity": 4,
      "isActive": true,
      "positionX": 100,
      "positionY": 200,
      "shape": "rectangle",
      "width": 60,
      "height": 60,
      "zoneName": "Patio",
      "createdAt": "2026-06-01T10:00:00.000Z",
      "updatedAt": "2026-07-04T10:00:00.000Z"
    }
  ],
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

**Errors:** `401`, `403`, `404` (branch not found)

---

### POST /api/v1/branches/{branchId}/tables

**Purpose:** Add a table to a branch.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `tables.create` |
| **Idempotent** | ✅ |

**Request Body:**

```json
{
  "tableNumber": "T-02",
  "minCapacity": 4,
  "maxCapacity": 8,
  "zoneId": "uuid",
  "positionX": 150,
  "positionY": 250,
  "shape": "round",
  "width": 80,
  "height": 80
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `tableNumber` | string | ✅ | 1–20 chars, unique within branch |
| `minCapacity` | integer | ✅ | 1–50, must be <= maxCapacity |
| `maxCapacity` | integer | ✅ | 1–50, must be >= minCapacity |
| `zoneId` | UUID | ❌ | Must reference existing zone |
| `positionX` | integer | ❌ | 0–10000 |
| `positionY` | integer | ❌ | 0–10000 |
| `shape` | string | ❌ | `rectangle`, `round`, `square`, `booth` |
| `width` | integer | ❌ | 20–500 |
| `height` | integer | ❌ | 20–500 |

**Response:** `201 Created`

**Errors:** `400`, `401`, `403`, `409` (duplicate table number)

---

### PATCH /api/v1/branches/{branchId}/tables/{id}

**Purpose:** Update table properties.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `tables.update` |
| **Idempotent** | ✅ |

**Response:** `200 OK`

---

### DELETE /api/v1/branches/{branchId}/tables/{id}

**Purpose:** Soft-delete a table.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `tables.delete` |
| **Idempotent** | ✅ (DELETE) |

**Response:** `204 No Content`

**Business Rules:** Cannot delete a table with future reservations.

---

### GET /api/v1/branches/{branchId}/tables/zones

**Purpose:** List table zones.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `tables.read` |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    { "id": "uuid", "branchId": "uuid", "name": "Patio", "description": "Outdoor seating", "sortOrder": 1, "tableCount": 8 }
  ],
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

---

### POST /api/v1/branches/{branchId}/tables/zones

**Purpose:** Create a table zone.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `tables.update` |

**Request Body:**

```json
{
  "name": "VIP Room",
  "description": "Private dining room",
  "sortOrder": 3
}
```

**Response:** `201 Created`

---

### PUT /api/v1/branches/{branchId}/tables/floor-plan

**Purpose:** Update the entire floor plan (all table positions at once).

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `tables.update` |
| **Idempotent** | ✅ |

**Request Body:**

```json
{
  "tables": [
    { "id": "uuid", "positionX": 100, "positionY": 200 },
    { "id": "uuid-2", "positionX": 300, "positionY": 200 }
  ]
}
```

**Response:** `200 OK`

---

## 7. Reservations

### GET /api/v1/reservations

**Purpose:** List reservations across branches.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `reservations.read` |
| **Idempotent** | ✅ (GET) |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | integer | ❌ | Page number (default: 1) |
| `pageSize` | integer | ❌ | Items per page (default: 20, max: 100) |
| `sortBy` | string | ❌ | `date`, `time`, `createdAt`, `partySize`, `status` |
| `sortDirection` | string | ❌ | `ASC`, `DESC` (default: ASC) |
| `branchId` | UUID | ❌ | Filter by branch |
| `customerId` | UUID | ❌ | Filter by customer |
| `date` | date | ❌ | Exact date filter |
| `gte_date` | date | ❌ | Start date range |
| `lte_date` | date | ❌ | End date range |
| `status` | string | ❌ | Filter by status |
| `in_status` | string | ❌ | Comma-separated status list |
| `assignedTo` | UUID | ❌ | Filter by assigned waiter |
| `q` | string | ❌ | Search by confirmation code or customer name |
| `isWalkIn` | boolean | ❌ | Filter walk-ins |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "branchId": "uuid",
      "customerId": "uuid",
      "createdBy": "uuid",
      "assignedTo": null,
      "confirmationCode": "TF-ABC123",
      "date": "2026-07-15",
      "time": "19:00:00",
      "partySize": 4,
      "status": "CONFIRMED",
      "source": "ONLINE",
      "isWalkIn": false,
      "specialRequests": "Anniversary dinner",
      "internalNotes": null,
      "cancellationReason": null,
      "checkedInAt": null,
      "checkedOutAt": null,
      "customer": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+14155551234"
      },
      "tables": [
        { "tableId": "uuid", "tableNumber": "T-01", "assignedAt": "2026-07-04T10:00:00.000Z" }
      ],
      "createdAt": "2026-07-04T10:00:00.000Z",
      "updatedAt": "2026-07-04T10:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 45, "totalPages": 3, "hasNextPage": true, "hasPreviousPage": false, "requestId": "req-uuid-v4" },
  "error": null
}
```

**Errors:** `401`, `403`

---

### POST /api/v1/reservations

**Purpose:** Create a new reservation.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `reservations.create` |
| **Idempotent** | ✅ |

**Request Body:**

```json
{
  "branchId": "uuid",
  "customerId": "uuid",
  "date": "2026-07-15",
  "time": "19:00:00",
  "partySize": 4,
  "source": "PHONE",
  "specialRequests": "Anniversary dinner",
  "internalNotes": "Regular customer — prefers patio",
  "tableIds": ["uuid-1", "uuid-2"]
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `branchId` | UUID | ✅ | Must reference existing branch |
| `customerId` | UUID | ✅ | Must reference existing customer |
| `date` | date | ✅ | Not in past, within booking window |
| `time` | time | ✅ | During business hours |
| `partySize` | integer | ✅ | 1–20 |
| `source` | string | ❌ | `PHONE`, `WALK_IN`, `ONLINE`, `STAFF` |
| `specialRequests` | string | ❌ | Max 2000 chars |
| `internalNotes` | string | ❌ | Max 2000 chars |
| `tableIds` | UUID[] | ❌ | Must reference active tables in branch |

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "confirmationCode": "TF-ABC123",
    "branchId": "uuid",
    "customerId": "uuid",
    "date": "2026-07-15",
    "time": "19:00:00",
    "partySize": 4,
    "status": "CONFIRMED",
    "source": "PHONE",
    "createdAt": "2026-07-04T10:00:00.000Z"
  },
  "meta": { "requestId": "req-uuid-v4", "location": "/api/v1/reservations/uuid" },
  "error": null
}
```

**Errors:** `400`, `401`, `403`, `409` (overlap), `422` (past date, outside hours, window)

**Business Rules:**
- Must use `SELECT ... FOR UPDATE` within a transaction to prevent double-booking
- If `tableIds` not provided, system auto-assigns best available table
- Status starts as `CONFIRMED` for staff/phone/walk-in, `PENDING` for online
- Sets `created_by` to the authenticated user
- `updated_by` set to the authenticated user
- Generates unique `confirmation_code`
- Creates initial `reservation_status_history` entry
- Triggers async notification (confirmation email/SMS)

**Auto-Assignment Logic:**
1. Find active tables in branch where `min_capacity <= partySize <= max_capacity`
2. Exclude tables with overlapping confirmed/seated reservations
3. Sort by `min_capacity ASC` (smallest table that fits)
4. Assign the best-matching table

---

### GET /api/v1/reservations/{id}

**Purpose:** Get reservation details.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `reservations.read` |
| **Idempotent** | ✅ (GET) |

**Response:** `200 OK` — Full reservation object with customer, tables, status history.

**Errors:** `401`, `403`, `404`

---

### PATCH /api/v1/reservations/{id}

**Purpose:** Update reservation details (time, party size, notes).

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `reservations.update` |
| **Idempotent** | ✅ |

**Request Body:** (all fields optional)

```json
{
  "time": "20:00:00",
  "partySize": 5,
  "specialRequests": "Updated: birthday dinner",
  "internalNotes": "Moved to later slot"
}
```

| Field | Type | Validation |
|-------|------|------------|
| `time` | time | During business hours |
| `partySize` | integer | 1–20 |
| `specialRequests` | string | Max 2000 chars |
| `internalNotes` | string | Max 2000 chars |
| `tableIds` | UUID[] | Must reference active tables in branch |

**Response:** `200 OK`

**Errors:** `400`, `401`, `403`, `404`, `409` (overlap), `422` (terminal status)

**Business Rules:**
- Cannot modify reservations in terminal status (COMPLETED, CANCELLED, NO_SHOW)
- Changing time/partySize re-checks table availability
- Sets `updated_by` to the authenticated user
- Logs changes to `reservation_status_history` only if status changes

---

### DELETE /api/v1/reservations/{id}

**Purpose:** Delete a reservation.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `reservations.delete` |
| **Idempotent** | ✅ (DELETE) |

**Response:** `204 No Content`

**Errors:** `401`, `403`, `404`

**Business Rules:**
- Cannot delete a reservation past the 30-minute check-in window
- Soft delete (maintains referential integrity for historical reservations)
- Use `POST /reservations/{id}/cancel` for customer-facing cancellations
- After soft delete, anonymize PII fields for GDPR compliance

---

### POST /api/v1/customers/{id}/flag

**Purpose:** Flag/unflag a customer.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `customers.flag` |

**Request Body:**

```json
{
  "isFlagged": true,
  "reason": "Repeated no-shows"
}
```

**Response:** `200 OK`

---

### GET /api/v1/customers/{id}/reservations

**Purpose:** Get a customer's reservation history.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `customers.read`, `reservations.read` |
| **Idempotent** | ✅ (GET) |

**Query Parameters:** Same as `GET /api/v1/reservations` with `customerId` pre-filtered.

**Response:** `200 OK` — Paginated reservation list.

---

## 9. Employees

### GET /api/v1/branches/{branchId}/employees

**Purpose:** List employees at a branch.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `users.read` |
| **Idempotent** | ✅ (GET) |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "branchId": "uuid",
      "employeeCode": "EMP-001",
      "position": "Head Chef",
      "hiredAt": "2025-01-15",
      "firstName": "Mario",
      "lastName": "Rossi",
      "email": "mario@restaurant.com",
      "phone": "+14155551234",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

---

### POST /api/v1/branches/{branchId}/employees

**Purpose:** Assign a user as an employee at a branch.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `users.create` |
| **Idempotent** | ✅ |

**Request Body:**

```json
{
  "userId": "uuid",
  "employeeCode": "EMP-002",
  "position": "Server",
  "hiredAt": "2026-07-01"
}
```

**Response:** `201 Created`

---

### PATCH /api/v1/branches/{branchId}/employees/{id}

**Purpose:** Update employee details.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `users.update` |

**Response:** `200 OK`

---

### DELETE /api/v1/branches/{branchId}/employees/{id}

**Purpose:** Remove employee from branch.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `users.delete` |

**Response:** `204 No Content`

---

## 10. Notifications

### GET /api/v1/notifications

**Purpose:** List notifications.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `settings.read` |
| **Idempotent** | ✅ (GET) |

**Pagination:** Cursor-based (`cursor`, `limit`).

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `cursor` | UUID | Cursor for pagination |
| `limit` | integer | Max items (default: 20, max: 100) |
| `branchId` | UUID | Filter by branch |
| `type` | string | Filter by type |
| `status` | string | Filter by delivery status |
| `gte_createdAt` | datetime | Start date range |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "branchId": "uuid",
      "reservationId": "uuid",
      "type": "CONFIRMATION",
      "recipientEmail": "john@example.com",
      "recipientPhone": "+14155551234",
      "status": "SENT",
      "sentAt": "2026-07-04T10:00:05.000Z",
      "errorMessage": null,
      "createdAt": "2026-07-04T10:00:00.000Z"
    }
  ],
  "meta": { "limit": 20, "hasMore": true, "nextCursor": "uuid", "requestId": "req-uuid-v4" },
  "error": null
}
```

---

### POST /api/v1/notifications/{id}/retry

**Purpose:** Retry a failed notification.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `settings.update` |

**Response:** `200 OK`

**Business Rules:** Only FAILED status notifications can be retried.

---

## 11. Reports

### POST /api/v1/reports/daily-summary

**Purpose:** Generate daily reservation summary for a branch.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `reports.view` |
| **Idempotent** | ✅ |
| **Rate limit** | 10/hr |

**Request Body:**

```json
{
  "branchId": "uuid",
  "date": "2026-07-15"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "branchId": "uuid",
    "date": "2026-07-15",
    "totalReservations": 48,
    "totalCovers": 184,
    "totalConfirmed": 35,
    "totalSeated": 30,
    "totalCompleted": 25,
    "totalNoShows": 3,
    "totalCancellations": 2,
    "occupancyRate": 0.78,
    "averagePartySize": 3.8,
    "peakHour": "19:00:00",
    "peakHourCovers": 28
  },
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

---

### POST /api/v1/reports/period-summary

**Purpose:** Generate summary for a date range.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `reports.view` |
| **Rate limit** | 10/hr |

**Request Body:**

```json
{
  "branchId": "uuid",
  "startDate": "2026-07-01",
  "endDate": "2026-07-31"
}
```

**Response:** `202 Accepted`

```json
{
  "success": true,
  "data": null,
  "meta": { "requestId": "req-uuid-v4", "statusUrl": "/api/v1/reports/status/report-uuid" },
  "error": null
}
```

**Business Rules:** Reports for periods > 7 days are generated asynchronously. Response includes a `statusUrl` for polling.

---

### GET /api/v1/reports/status/{reportId}

**Purpose:** Check async report generation status.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `reports.view` |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "progress": 100,
    "resultUrl": "/api/v1/reports/download/uuid",
    "expiresAt": "2026-08-04T10:00:00.000Z"
  },
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

---

### GET /api/v1/reports/export

**Purpose:** Export reservation data as CSV.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `reports.export` |
| **Rate limit** | 10/hr |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `branchId` | UUID | ✅ | Branch to export |
| `startDate` | date | ✅ | Start of range |
| `endDate` | date | ✅ | End of range |
| `format` | string | ❌ | `csv` (default), `xlsx` |

**Response:** `200 OK` with `Content-Type: text/csv` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

---

## 12. Dashboard

### GET /api/v1/dashboard/today

**Purpose:** Get today's dashboard summary for a branch.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | Implicit (role-based view) |
| **Idempotent** | ✅ (GET) |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `branchId` | UUID | ✅ | Branch dashboard |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "branchId": "uuid",
    "date": "2026-07-04",
    "totalReservations": 48,
    "totalCovers": 184,
    "confirmedCount": 35,
    "seatedCount": 30,
    "completedCount": 25,
    "noShowCount": 3,
    "cancelledCount": 2,
    "walkInCount": 4,
    "availableTables": 12,
    "occupiedTables": 15,
    "outOfServiceTables": 1,
    "occupancyRate": 0.65,
    "upcomingReservations": [
      {
        "id": "uuid",
        "time": "19:00:00",
        "partySize": 4,
        "customerName": "John Doe",
        "status": "CONFIRMED",
        "tableNumbers": ["T-01"]
      }
    ]
  },
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

---

### GET /api/v1/dashboard/weekly

**Purpose:** Get weekly reservation trends.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | Implicit |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `branchId` | UUID | ✅ | Branch |
| `startDate` | date | ❌ | Default: Monday of current week |

**Response:** `200 OK` — Array of daily summaries.

---

## 13. Settings

### GET /api/v1/settings

**Purpose:** List configuration settings.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `settings.read` |
| **Idempotent** | ✅ (GET) |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `branchId` | UUID | Filter by branch (null = org-level) |
| `key` | string | Filter by specific setting key |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "branchId": null,
      "key": "notifications.reminder_timing",
      "value": { "hoursBefore": 2 },
      "updatedAt": "2026-07-01T10:00:00.000Z"
    },
    {
      "id": "uuid-2",
      "branchId": "uuid",
      "key": "notifications.reminder_timing",
      "value": { "hoursBefore": 4 },
      "updatedAt": "2026-07-02T10:00:00.000Z"
    }
  ],
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

---

### PUT /api/v1/settings/{id}

**Purpose:** Update a setting value.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `settings.update` |
| **Idempotent** | ✅ |

**Request Body:**

```json
{
  "value": { "hoursBefore": 3 }
}
```

**Response:** `200 OK`

---

### PUT /api/v1/settings/bulk

**Purpose:** Update multiple settings at once.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `settings.update` |
| **Idempotent** | ✅ |

**Request Body:**

```json
{
  "settings": [
    { "id": "uuid-1", "value": { "hoursBefore": 3 } },
    { "id": "uuid-2", "value": { "enabled": false } }
  ]
}
```

**Response:** `200 OK`

---

## 14. Audit Logs

### GET /api/v1/audit-logs

**Purpose:** Query system audit logs.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `audit.read` |
| **Idempotent** | ✅ (GET) |

**Pagination:** Cursor-based (`cursor`, `limit`).

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `cursor` | UUID | Cursor for pagination |
| `limit` | integer | Max items (default: 20, max: 100) |
| `userId` | UUID | Filter by actor |
| `action` | string | Filter by action (e.g., `reservation.cancel`) |
| `resourceType` | string | Filter by resource type |
| `resourceId` | UUID | Filter by specific resource |
| `gte_createdAt` | datetime | Start date |
| `lte_createdAt` | datetime | End date |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "Jane Smith",
      "action": "reservation.cancel",
      "resourceType": "reservation",
      "resourceId": "uuid",
      "details": {
        "before": { "status": "CONFIRMED" },
        "after": { "status": "CANCELLED", "cancellationReason": "Customer request" }
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-07-04T10:00:00.000Z"
    }
  ],
  "meta": { "limit": 20, "hasMore": true, "nextCursor": "uuid", "requestId": "req-uuid-v4" },
  "error": null
}
```

**Errors:** `401`, `403`

---

## 15. Webhook Management

### GET /api/v1/webhooks

**Purpose:** List webhook subscriptions.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `settings.read` |
| **Idempotent** | ✅ (GET) |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "url": "https://pos.example.com/webhooks/tableflow",
      "events": ["reservation.created", "reservation.cancelled"],
      "isActive": true,
      "lastDeliveryAt": "2026-07-04T10:00:00.000Z",
      "lastDeliveryStatus": "SUCCESS",
      "createdAt": "2026-06-15T10:00:00.000Z"
    }
  ],
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

---

### POST /api/v1/webhooks

**Purpose:** Create a webhook subscription.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `settings.update` |
| **Idempotent** | ✅ |

**Request Body:**

```json
{
  "url": "https://pos.example.com/webhooks/tableflow",
  "events": ["reservation.created", "reservation.cancelled"],
  "isActive": true
}
```

**Response:** `201 Created`

---

### PUT /api/v1/webhooks/{id}

**Purpose:** Update a webhook subscription.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `settings.update` |

**Response:** `200 OK`

---

### DELETE /api/v1/webhooks/{id}

**Purpose:** Delete a webhook subscription.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `settings.update` |

**Response:** `204 No Content`

---

## 16. Global Search

### GET /api/v1/search

**Purpose:** Global search across multiple resource types.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | Varies by scope |
| **Idempotent** | ✅ (GET) |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | ✅ | Search query (min 2 chars) |
| `scope` | string | ❌ | Comma-separated resource types (default: all) |
| `limit` | integer | ❌ | Results per scope (default: 5, max: 20) |

**Response:** `200 OK` — See [search.md](./search.md) for full response structure.

**Errors:** `400` (query too short)

---

## 17. Reservation Policy

### GET /api/v1/restaurants/{id}/reservation-policy

**Purpose:** Get reservation policy with auto-create defaults.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `restaurants.reservation-policy.read` |
| **Idempotent** | ✅ (GET) |

**Path Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Restaurant ID |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "restaurantId": "uuid",
    "enabled": true,
    "minPartySize": 1,
    "maxPartySize": 20,
    "defaultReservationDuration": 60,
    "minAdvanceBookingMinutes": 60,
    "maxAdvanceBookingDays": 30,
    "cancellationDeadlineMinutes": 1440,
    "modificationDeadlineMinutes": 1440,
    "allowWalkIns": true,
    "autoConfirmReservations": false,
    "requireCustomerPhone": false,
    "requireCustomerEmail": true,
    "maxActiveReservationsPerCustomer": 10,
    "gracePeriodMinutes": 15,
    "createdAt": "2026-07-07T12:00:00.000Z",
    "updatedAt": "2026-07-07T12:00:00.000Z"
  }
}
```

**Errors:** `400` (invalid UUID), `401`, `403`

---

### PUT /api/v1/restaurants/{id}/reservation-policy

**Purpose:** Update reservation policy.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `restaurants.reservation-policy.update` |
| **Idempotent** | ✅ |

**Path Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Restaurant ID |

**Request Body:**

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| `enabled` | boolean | ❌ | `true` | — |
| `minPartySize` | integer | ❌ | `1` | 1–100 |
| `maxPartySize` | integer | ❌ | `20` | 1–100, must be >= minPartySize |
| `defaultReservationDuration` | integer | ❌ | `60` | 15–480 (minutes) |
| `minAdvanceBookingMinutes` | integer | ❌ | `60` | 0–43200 (minutes) |
| `maxAdvanceBookingDays` | integer | ❌ | `30` | 0–365 (days) |
| `cancellationDeadlineMinutes` | integer | ❌ | `1440` | 0–43200 (minutes) |
| `modificationDeadlineMinutes` | integer | ❌ | `1440` | 0–43200 (minutes) |
| `allowWalkIns` | boolean | ❌ | `true` | — |
| `autoConfirmReservations` | boolean | ❌ | `false` | — |
| `requireCustomerPhone` | boolean | ❌ | `false` | — |
| `requireCustomerEmail` | boolean | ❌ | `true` | — |
| `maxActiveReservationsPerCustomer` | integer | ❌ | `10` | 1–100 |
| `gracePeriodMinutes` | integer | ❌ | `15` | 0–120 (minutes) |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "restaurantId": "uuid",
    "enabled": true,
    "minPartySize": 2,
    "maxPartySize": 50,
    "defaultReservationDuration": 90,
    "minAdvanceBookingMinutes": 120,
    "maxAdvanceBookingDays": 60,
    "cancellationDeadlineMinutes": 720,
    "modificationDeadlineMinutes": 1440,
    "allowWalkIns": false,
    "autoConfirmReservations": true,
    "requireCustomerPhone": false,
    "requireCustomerEmail": true,
    "maxActiveReservationsPerCustomer": 10,
    "gracePeriodMinutes": 15,
    "createdAt": "2026-07-07T12:00:00.000Z",
    "updatedAt": "2026-07-07T12:00:10.000Z"
  },
  "message": "Reservation policy updated successfully"
}
```

**Errors:** `400` (validation), `401`, `403`

---

## 18. Business Hours

### GET /api/v1/restaurants/{id}/business-hours

**Purpose:** Get business hours with auto-create defaults (Mon-Fri 09:00-17:00, Sat-Sun closed).

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `restaurants.business-hours.read` |
| **Idempotent** | ✅ (GET) |

**Path Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Restaurant ID |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "restaurantId": "uuid",
    "schedules": [
      {
        "dayOfWeek": 1,
        "isClosed": false,
        "periods": [{ "openTime": "09:00", "closeTime": "17:00", "order": 0 }]
      },
      { "dayOfWeek": 6, "isClosed": true, "periods": [] },
      { "dayOfWeek": 7, "isClosed": true, "periods": [] }
    ],
    "createdAt": "2026-07-07T12:00:00.000Z",
    "updatedAt": "2026-07-07T12:00:00.000Z"
  }
}
```

**Errors:** `400`, `401`, `403`

---

### PUT /api/v1/restaurants/{id}/business-hours

**Purpose:** Replace all business hours for a restaurant.

| Attribute | Value |
|-----------|-------|
| **Auth** | ✅ Required |
| **Permission** | `restaurants.business-hours.update` |
| **Idempotent** | ✅ |

**Path Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Restaurant ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schedules` | array | ✅ | Array of 1–7 day schedules |

**Day Schedule Object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dayOfWeek` | integer | ✅ | 1=Monday .. 7=Sunday |
| `isClosed` | boolean | ✅ | If true, `periods` must be empty |
| `periods` | array | ✅ | Array of opening periods (max 10) |

**Opening Period Object:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `openTime` | string | ✅ | `HH:MM` format (00:00–23:59) |
| `closeTime` | string | ✅ | `HH:MM` format, must be after `openTime` |
| `order` | integer | ✅ | Non-negative display order |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "restaurantId": "uuid",
    "schedules": [
      {
        "dayOfWeek": 1,
        "isClosed": false,
        "periods": [
          { "openTime": "08:00", "closeTime": "12:00", "order": 0 },
          { "openTime": "13:00", "closeTime": "18:00", "order": 1 }
        ]
      },
      { "dayOfWeek": 3, "isClosed": true, "periods": [] }
    ],
    "createdAt": "2026-07-07T12:00:00.000Z",
    "updatedAt": "2026-07-07T12:00:10.000Z"
  },
  "message": "Business hours updated successfully"
}
```

**Business Rules:**
- Open time must be before close time
- Periods within the same day must not overlap
- Maximum 10 periods per day
- Closed days cannot have periods
- Periods are sorted by `order` within each day

**Errors:** `400` (validation), `401`, `403`

---

## Endpoint Summary

| Module | Method | URL | Permission |
|--------|--------|-----|------------|
| **Auth** | POST | `/auth/register` | None |
| **Auth** | POST | `/auth/login` | None |
| **Auth** | POST | `/auth/refresh` | None |
| **Auth** | POST | `/auth/logout` | Implicit |
| **Auth** | POST | `/auth/forgot-password` | None |
| **Auth** | POST | `/auth/reset-password` | None |
| **Auth** | POST | `/auth/verify-email` | None |
| **Auth** | POST | `/auth/change-password` | Implicit |
| **Users** | GET | `/users` | `users.read` |
| **Users** | POST | `/users` | `users.create` |
| **Users** | GET | `/users/{id}` | `users.read` |
| **Users** | PATCH | `/users/{id}` | `users.update` |
| **Users** | DELETE | `/users/{id}` | `users.delete` |
| **Roles** | GET | `/roles` | `roles.read` |
| **Roles** | GET | `/roles/{id}` | `roles.read` |
| **Roles** | POST | `/roles` | `roles.create` |
| **Roles** | PUT | `/roles/{id}` | `roles.update` |
| **Roles** | DELETE | `/roles/{id}` | `roles.delete` |
| **Permissions** | GET | `/permissions` | `roles.read` |
| **Organizations** | GET | `/organizations` | System admin |
| **Organizations** | GET | `/organizations/{id}` | Implicit |
| **Organizations** | PATCH | `/organizations/{id}` | `settings.update` |
| **Branches** | GET | `/branches` | `branches.read` |
| **Branches** | POST | `/branches` | `branches.create` |
| **Branches** | GET | `/branches/{id}` | `branches.read` |
| **Branches** | PUT | `/branches/{id}` | `branches.update` |
| **Branches** | PATCH | `/branches/{id}` | `branches.update` |
| **Branches** | DELETE | `/branches/{id}` | `branches.delete` |
| **Branches** | GET | `/branches/{id}/business-hours` | `branches.read` |
| **Branches** | PUT | `/branches/{id}/business-hours` | `branches.update` |
| **Branches** | GET | `/branches/{id}/holiday-hours` | `branches.read` |
| **Branches** | POST | `/branches/{id}/holiday-hours` | `branches.update` |
| **Branches** | DELETE | `/branches/{id}/holiday-hours/{hid}` | `branches.update` |
| **Tables** | GET | `/branches/{branchId}/tables` | `tables.read` |
| **Tables** | POST | `/branches/{branchId}/tables` | `tables.create` |
| **Tables** | PATCH | `/branches/{branchId}/tables/{id}` | `tables.update` |
| **Tables** | DELETE | `/branches/{branchId}/tables/{id}` | `tables.delete` |
| **Tables** | GET | `/branches/{branchId}/tables/zones` | `tables.read` |
| **Tables** | POST | `/branches/{branchId}/tables/zones` | `tables.update` |
| **Tables** | PUT | `/branches/{branchId}/tables/floor-plan` | `tables.update` |
| **Reservations** | GET | `/reservations` | `reservations.read` |
| **Reservations** | POST | `/reservations` | `reservations.create` |
| **Reservations** | GET | `/reservations/{id}` | `reservations.read` |
| **Reservations** | PATCH | `/reservations/{id}` | `reservations.update` |
| **Reservations** | DELETE | `/reservations/{id}` | `reservations.delete` |
| **Reservations** | POST | `/reservations/{id}/confirm` | `reservations.confirm` |
| **Reservations** | POST | `/reservations/{id}/cancel` | `reservations.cancel` |
| **Reservations** | POST | `/reservations/{id}/check-in` | `reservations.checkin` |
| **Reservations** | POST | `/reservations/{id}/check-out` | `reservations.checkout` |
| **Reservations** | POST | `/reservations/{id}/mark-noshow` | `reservations.noshow` |
| **Reservations** | POST | `/reservations/{id}/assign-tables` | `reservations.assign_table` |
| **Reservations** | GET | `/reservations/availability` | `reservations.read` |
| **Reservations** | GET | `/reservations/{id}/status-history` | `reservations.read` |
| **Customers** | GET | `/customers` | `customers.read` |
| **Customers** | POST | `/customers` | `customers.create` |
| **Customers** | GET | `/customers/{id}` | `customers.read` |
| **Customers** | PATCH | `/customers/{id}` | `customers.update` |
| **Customers** | DELETE | `/customers/{id}` | `customers.delete` |
| **Customers** | POST | `/customers/{id}/flag` | `customers.flag` |
| **Customers** | GET | `/customers/{id}/reservations` | `customers.read` |
| **Employees** | GET | `/branches/{branchId}/employees` | `users.read` |
| **Employees** | POST | `/branches/{branchId}/employees` | `users.create` |
| **Employees** | PATCH | `/branches/{branchId}/employees/{id}` | `users.update` |
| **Employees** | DELETE | `/branches/{branchId}/employees/{id}` | `users.delete` |
| **Notifications** | GET | `/notifications` | `settings.read` |
| **Notifications** | POST | `/notifications/{id}/retry` | `settings.update` |
| **Reports** | POST | `/reports/daily-summary` | `reports.view` |
| **Reports** | POST | `/reports/period-summary` | `reports.view` |
| **Reports** | GET | `/reports/status/{reportId}` | `reports.view` |
| **Reports** | GET | `/reports/export` | `reports.export` |
| **Dashboard** | GET | `/dashboard/today` | Implicit |
| **Dashboard** | GET | `/dashboard/weekly` | Implicit |
| **Restaurants** | POST | `/restaurants` | `restaurants.create` |
| **Restaurants** | GET | `/restaurants` | `restaurants.read` |
| **Restaurants** | GET | `/restaurants/{id}` | `restaurants.read` |
| **Restaurants** | PUT | `/restaurants/{id}` | `restaurants.update` |
| **Restaurants** | PATCH | `/restaurants/{id}/activate` | `restaurants.activate` |
| **Restaurants** | PATCH | `/restaurants/{id}/suspend` | `restaurants.suspend` |
| **Restaurants** | PATCH | `/restaurants/{id}/archive` | `restaurants.archive` |
| **Reservation Policy** | GET | `/restaurants/{id}/reservation-policy` | `restaurants.reservation-policy.read` |
| **Reservation Policy** | PUT | `/restaurants/{id}/reservation-policy` | `restaurants.reservation-policy.update` |
| **Business Hours** | GET | `/restaurants/{id}/business-hours` | `restaurants.business-hours.read` |
| **Business Hours** | PUT | `/restaurants/{id}/business-hours` | `restaurants.business-hours.update` |
| **Settings** | GET | `/settings` | `settings.read` |
| **Settings** | PUT | `/settings/{id}` | `settings.update` |
| **Settings** | PUT | `/settings/bulk` | `settings.update` |
| **Audit Logs** | GET | `/audit-logs` | `audit.read` |
| **Webhooks** | GET | `/webhooks` | `settings.read` |
| **Webhooks** | POST | `/webhooks` | `settings.update` |
| **Webhooks** | PUT | `/webhooks/{id}` | `settings.update` |
| **Webhooks** | DELETE | `/webhooks/{id}` | `settings.update` |
| **Search** | GET | `/search` | Varies |

## Cross-References

- [api-overview.md](./api-overview.md) — Module structure
- [authentication.md](./authentication.md) — Auth endpoint details
- [authorization.md](./authorization.md) — Permission definitions
- [pagination.md](./pagination.md) — Pagination parameters
- [filtering.md](./filtering.md) — Filter parameters
- [sorting.md](./sorting.md) — Sort parameters
- [request-response-standards.md](./request-response-standards.md) — Response formats
- [error-catalog.md](./error-catalog.md) — Error codes
- [validation.md](./validation.md) — Validation rules
- [idempotency.md](./idempotency.md) — Idempotency support
- [webhooks.md](./webhooks.md) — Webhook event details
