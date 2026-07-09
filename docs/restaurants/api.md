# Restaurant REST API

**Last updated:** 2026-07-07

## Overview

The Restaurants API provides CRUD and lifecycle management for restaurant tenants. Each restaurant is backed by an `organization` record in the database with a `restaurant_` prefix role.

## Base URL

```
/api/v1/restaurants
```

## Authentication & Authorization

All endpoints require authentication and specific permissions:

| Endpoint | Method | Required Permission |
|----------|--------|-------------------|
| `POST /api/v1/restaurants` | Create | `restaurants.create` |
| `GET /api/v1/restaurants` | List | `restaurants.read` |
| `GET /api/v1/restaurants/:id` | Get By ID | `restaurants.read` |
| `PUT /api/v1/restaurants/:id` | Update | `restaurants.update` |
| `PATCH /api/v1/restaurants/:id/activate` | Activate | `restaurants.activate` |
| `PATCH /api/v1/restaurants/:id/suspend` | Suspend | `restaurants.suspend` |
| `PATCH /api/v1/restaurants/:id/archive` | Archive | `restaurants.archive` |
| `GET /api/v1/restaurants/:id/business-hours` | Get Business Hours | `restaurants.business-hours.read` |
| `PUT /api/v1/restaurants/:id/business-hours` | Update Business Hours | `restaurants.business-hours.update` |
| `GET /api/v1/restaurants/:id/reservation-policy` | Get Reservation Policy | `restaurants.reservation-policy.read` |
| `PUT /api/v1/restaurants/:id/reservation-policy` | Update Reservation Policy | `restaurants.reservation-policy.update` |

Permission enforcement is handled via the `requirePermission` middleware which integrates with the IAM module.

## Endpoints

### Create Restaurant

```
POST /api/v1/restaurants
```

Creates a new restaurant tenant with initial status `draft`.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | ✅ | — | Restaurant display name (max 255) |
| `slug` | string | ✅ | — | URL-friendly identifier (pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`) |
| `legalName` | string | ❌ | — | Legal business name (max 255) |
| `taxId` | string | ❌ | — | Tax identification number (max 50) |
| `email` | string | ❌ | — | Contact email |
| `phone` | string | ❌ | — | Contact phone (max 20) |
| `website` | string | ❌ | — | Website URL (max 500) |
| `logoUrl` | string | ❌ | — | Logo URL (max 500) |
| `address` | string | ❌ | — | Physical address |
| `timezone` | string | ❌ | `UTC` | IANA timezone identifier |
| `currency` | string | ❌ | `USD` | ISO 4217 currency code |
| `language` | string | ❌ | `en` | ISO 639-1 language code |

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "0194f2e0-7b3a-7f00-8000-000000000001",
    "name": "My Restaurant",
    "slug": "my-restaurant",
    "legalName": null,
    "taxId": null,
    "email": "contact@myrestaurant.com",
    "phone": "+14155551234",
    "website": null,
    "logoUrl": null,
    "address": null,
    "status": "draft",
    "timezone": "America/New_York",
    "currency": "USD",
    "language": "en",
    "createdAt": "2026-07-07T12:00:00.000Z",
    "updatedAt": "2026-07-07T12:00:00.000Z",
    "deletedAt": null
  }
}
```

**Errors:**

| Code | Status | Description |
|------|--------|-------------|
| `validation.failed` | 400 | Invalid request body |
| `auth.token.missing` | 401 | Missing authentication |
| `auth.forbidden` | 403 | Missing `restaurants.create` permission |
| `resource.duplicate` | 409 | Slug already exists |

---

### List Restaurants

```
GET /api/v1/restaurants?page=1&pageSize=20&sortBy=createdAt&sortDirection=desc&status=active&q=search
```

Returns a paginated list of restaurants.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number (1-indexed) |
| `pageSize` | integer | `20` | Items per page (max 100) |
| `sortBy` | string | `createdAt` | Sort field |
| `sortDirection` | `asc` \| `desc` | `desc` | Sort direction |
| `status` | string | — | Filter by status: `draft`, `pending`, `active`, `suspended`, `inactive`, `archived` |
| `q` | string | — | Search query (matches name, slug, email) |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "0194f2e0-7b3a-7f00-8000-000000000001",
      "name": "My Restaurant",
      "slug": "my-restaurant",
      "status": "active",
      "timezone": "America/New_York",
      "currency": "USD",
      "language": "en",
      "createdAt": "2026-07-07T12:00:00.000Z",
      "updatedAt": "2026-07-07T12:00:00.000Z",
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

### Get Restaurant By ID

```
GET /api/v1/restaurants/:id
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID v7 | Restaurant ID |

**Response:** `200 OK`

Returns a single restaurant object (same shape as list item but with all fields).

**Errors:**

| Code | Status | Description |
|------|--------|-------------|
| `auth.token.missing` | 401 | Missing authentication |
| `auth.forbidden` | 403 | Missing `restaurants.read` permission |
| `resource.not_found` | 404 | Restaurant not found |

---

### Update Restaurant

```
PUT /api/v1/restaurants/:id
```

Updates restaurant properties. All fields are optional — only provided fields are updated.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name (max 255) |
| `slug` | string | URL-friendly identifier |
| `legalName` | string | Legal business name (max 255) |
| `taxId` | string | Tax ID (max 50) |
| `email` | string | Contact email |
| `phone` | string | Contact phone (max 20) |
| `website` | string | Website URL |
| `logoUrl` | string | Logo URL |
| `address` | string | Physical address |
| `timezone` | string | IANA timezone |
| `currency` | string | ISO 4217 currency code |
| `language` | string | ISO 639-1 language code |

**Response:** `200 OK`

Returns the updated restaurant object.

**Errors:**

| Code | Status | Description |
|------|--------|-------------|
| `validation.failed` | 400 | Invalid request body |
| `auth.token.missing` | 401 | Missing authentication |
| `auth.forbidden` | 403 | Missing `restaurants.update` permission |
| `resource.not_found` | 404 | Restaurant not found |

---

### Activate Restaurant

```
PATCH /api/v1/restaurants/:id/activate
```

Transitions a restaurant from `draft` or `suspended` to `active`.

**Response:** `200 OK`

Returns the updated restaurant object with `status: "active"`.

**Errors:**

| Code | Status | Description |
|------|--------|-------------|
| `auth.token.missing` | 401 | Missing authentication |
| `auth.forbidden` | 403 | Missing `restaurants.activate` permission |
| `resource.not_found` | 404 | Restaurant not found |
| `domain.invalid_status_transition` | 422 | Cannot activate from current status |

---

### Suspend Restaurant

```
PATCH /api/v1/restaurants/:id/suspend
```

Transitions a restaurant from `active` to `suspended`. An optional reason can be provided.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | ❌ | Suspension reason (max 500) |

**Response:** `200 OK`

Returns the updated restaurant object with `status: "suspended"`.

**Errors:**

| Code | Status | Description |
|------|--------|-------------|
| `auth.token.missing` | 401 | Missing authentication |
| `auth.forbidden` | 403 | Missing `restaurants.suspend` permission |
| `resource.not_found` | 404 | Restaurant not found |
| `domain.invalid_status_transition` | 422 | Cannot suspend from current status |

---

### Archive Restaurant

```
PATCH /api/v1/restaurants/:id/archive
```

Transitions a restaurant to `archived`. This is a terminal soft-delete.

**Response:** `200 OK`

Returns the updated restaurant object with `status: "archived"`.

**Errors:**

| Code | Status | Description |
|------|--------|-------------|
| `auth.token.missing` | 401 | Missing authentication |
| `auth.forbidden` | 403 | Missing `restaurants.archive` permission |
| `resource.not_found` | 404 | Restaurant not found |
| `domain.invalid_status_transition` | 422 | Cannot archive from current status |

---

### Get/Update Reservation Policy

```
GET  /api/v1/restaurants/:id/reservation-policy
PUT  /api/v1/restaurants/:id/reservation-policy
```

Manages restaurant reservation constraints as a separate aggregate. See [Reservation Policy](../reservation-policy.md) for full documentation.

**Permissions:**

| Method | Permission |
|--------|------------|
| `GET` | `restaurants.reservation-policy.read` |
| `PUT` | `restaurants.reservation-policy.update` |

The `GET` endpoint uses `getOrCreate` — reads existing policy or auto-creates with defaults. The `PUT` endpoint merges partial updates and auto-creates if not yet persisted (upsert behavior for first write).

**Response:** `200 OK`

See [endpoint-catalog.md](../api/endpoint-catalog.md#17-reservation-policy) for full field reference.

---

### Get/Update Business Hours

```
GET  /api/v1/restaurants/:id/business-hours
PUT  /api/v1/restaurants/:id/business-hours
```

Manages restaurant operating hours with support for multiple opening periods per day. See [Business Hours](../business-hours.md) for full documentation.

**Permissions:**

| Method | Permission |
|--------|------------|
| `GET` | `restaurants.business-hours.read` |
| `PUT` | `restaurants.business-hours.update` |

The `GET` endpoint uses `getOrCreate` — reads existing hours or auto-creates with defaults (Mon-Fri 09:00-17:00, Sat-Sun closed). The `PUT` endpoint replaces all schedules and auto-creates if not yet persisted.

**Response:** `200 OK`

See [endpoint-catalog.md](../api/endpoint-catalog.md#18-business-hours) for full field reference.

---

## Status Lifecycle

```
                  ┌─────────┐
                  │  draft   │
                  └────┬────┘
                       │ activate
                       ▼
                  ┌─────────┐
       suspend    │  active  │
      ┌──────────┤         │
      │          └─────────┘
      ▼               │
  ┌──────────┐        │ archive
  │ suspended│        ▼
  └────┬─────┘   ┌──────────┐
       │         │ archived  │
       │         └──────────┘
       │ activate
       │
       ▼
   ┌─────────┐
   │  active  │
   └─────────┘
```

Additional statuses (`pending`, `inactive`) exist but are not directly settable via the REST API.

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `auth.token.missing` | 401 | Authentication required |
| `auth.forbidden` | 403 | Insufficient permissions |
| `resource.not_found` | 404 | Restaurant not found |
| `resource.duplicate` | 409 | Slug already in use |
| `validation.failed` | 400 | Request validation failed |
| `domain.invalid_status_transition` | 422 | Invalid status transition |
| `domain.restaurant_inactive` | 422 | Restaurant is not in a modifiable state |

## Common Response Envelope

All responses follow the standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "error.code",
    "message": "Human-readable message",
    "details": []
  }
}
```

## Related Documentation

- [OpenAPI Spec](../api/openapi/openapi.yaml) — Full API specification
- [Application Layer](./application-layer.md) — Domain logic and service architecture
