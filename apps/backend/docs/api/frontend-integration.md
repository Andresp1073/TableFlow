# TableFlow Frontend-Backend Integration Guide

Base URL: `http://localhost:4000/api/v1`

## Type Generation Pipeline

This project provides an **OpenAPI 3.1** spec at `docs/api/openapi.json` and a **TypeScript type generation pipeline** using `openapi-typescript`:

```bash
# Generate types from the OpenAPI spec:
pnpm --filter @tableflow/backend api:generate

# Check that generated types are up-to-date (CI):
pnpm --filter @tableflow/backend api:check
```

Generated types are written to `src/generated/api-types.ts` and export:
- `paths` — per-endpoint request params, request bodies, and response shapes
- `components` — reusable schemas (ApiResponse, ApiError, LoginResponse, RestaurantDTO, etc.)
- `operations` — typed operation identifiers

**Usage in frontend:**
```typescript
import type { paths, components } from '@tableflow/backend/src/generated/api-types';

type LoginResponse = components['schemas']['LoginResponse'];
type RestaurantDTO = components['schemas']['RestaurantDTO'];
```

> Note: If consuming from the frontend app, copy or reference the generated file from `apps/backend/src/generated/api-types.ts`.

## API Conventions

### Naming
- **Resources**: Plural nouns (`/restaurants`, `/tables`, `/reservations`)
- **Sub-resources**: Nested under resource ID (`/restaurants/:id/tables`)
- **Actions**: HTTP methods for CRUD, verb-based paths for actions (`/activate`, `/archive`)
- **Consistent parameter names**: `id` (resource), `restaurantId`, `organizationId`

### HTTP Methods
| Method | Usage |
|--------|-------|
| `GET` | Retrieve resource(s) |
| `POST` | Create resource or trigger action |
| `PUT` | Full resource replacement |
| `PATCH` | Partial update or state transition |
| `DELETE` | Remove resource |

### Status Codes
| Code | Usage |
|------|-------|
| `200` | Success (read, update, action) |
| `201` | Created (POST) |
| `204` | No Content (DELETE, logout) |
| `400` | Validation error |
| `401` | Missing/invalid/expired authentication |
| `403` | Insufficient permissions |
| `404` | Resource not found |
| `409` | Conflict (duplicate) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

## Response Format

### Success (Single Resource)
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-07-17T12:00:00.000Z"
}
```

### Success (Collection)
```json
{
  "success": true,
  "data": [ ... ],
  "timestamp": "2026-07-17T12:00:00.000Z"
}
```

### Success (Paginated Collection)
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  },
  "timestamp": "2026-07-17T12:00:00.000Z"
}
```

### Success (Action with Message)
```json
{
  "success": true,
  "data": null,
  "message": "Password changed successfully",
  "timestamp": "2026-07-17T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "validation.failed",
    "message": "Validation failed",
    "details": {
      "email": ["Invalid email format"],
      "password": ["Password must be at least 8 characters"]
    },
    "timestamp": "2026-07-17T12:00:00.000Z",
    "path": "/api/v1/auth/login",
    "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  "timestamp": "2026-07-17T12:00:00.000Z"
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `validation.failed` | 400 | Request validation failed (Zod) |
| `auth.token.missing` | 401 | No Bearer token provided |
| `auth.token.invalid` | 401 | Token is malformed or invalid |
| `auth.token.expired` | 401 | Access token has expired |
| `auth.token.revoked` | 401 | Refresh token has been revoked |
| `auth.invalid_credentials` | 401 | Wrong email or password |
| `auth.account_locked` | 401 | Account temporarily locked |
| `auth.account_disabled` | 401 | Account is disabled |
| `auth.forbidden` | 403 | Insufficient permissions |
| `resource.not_found` | 404 | Resource does not exist |
| `resource.duplicate` | 409 | Duplicate resource |
| `rate_limit.exceeded` | 429 | Too many requests |
| `internal.error` | 500 | Unexpected server error |

## Authentication Flow

### Login
```
POST /auth/login
Body: { "email": "...", "password": "..." }
→ 200: { data: { accessToken, refreshToken, expiresIn, user } }
```

### Authenticate Requests
```
Headers: { "Authorization": "Bearer <accessToken>" }
```

### Token Refresh (Rotation Pattern)
```
POST /auth/refresh
Body: { "refreshToken": "<refreshToken>" }
→ 200: { data: { accessToken, refreshToken, expiresIn, user } }
```

### Logout
```
POST /auth/logout
Headers: { "Authorization": "Bearer <accessToken>" }
Body: { "refreshToken": "<refreshToken>" }
→ 204: No Content
```

## Pagination

### Request Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 10 | Items per page (max 100) |
| `sort` | string | createdAt | Field to sort by |
| `order` | asc\|desc | desc | Sort direction |

### Response Meta
```json
"meta": {
  "page": 1,
  "limit": 10,
  "total": 42,
  "totalPages": 5
}
```

## Filtering

### Pattern
Filter parameters are passed as query string key-value pairs:
```
GET /restaurants/:id/tables?status=available&capacity=4
GET /restaurants/:id/reservations?startDate=2026-07-01&endDate=2026-07-31
```

### Date Filters
- Date parameters use ISO 8601 format: `YYYY-MM-DD` or full ISO datetime
- Range filters use `startDate` / `endDate` naming convention

## Common Headers

| Header | Description |
|--------|-------------|
| `Authorization: Bearer <token>` | JWT access token |
| `X-Request-Id` | Client-generated correlation ID (optional) |
| `Content-Type: application/json` | Request body format |

## Response Headers

| Header | Description |
|--------|-------------|
| `X-Request-Id` | Correlation ID (echoed from request or generated) |

## TypeScript Types (Frontend)

```typescript
// API Envelope
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: ApiError;
  message?: string;
  timestamp: string;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  timestamp?: string;
  path?: string;
  correlationId?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Auth
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface SessionInfo {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

// Restaurant
interface Restaurant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  timezone: string;
  currency: string;
  language: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Dining Area
interface DiningArea {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Table Type
interface TableType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  defaultCapacity: number;
  minimumCapacity: number;
  maximumCapacity: number;
  shape: string;
  isReservable: boolean;
  displayOrder: number;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// Table
interface RestaurantTable {
  id: string;
  tableNumber: string;
  name: string | null;
  description: string | null;
  status: string;
  minCapacity: number;
  maxCapacity: number;
  diningAreaId: string | null;
  tableTypeId: string | null;
  branchId: string | null;
  positionX: number | null;
  positionY: number | null;
  rotation: number;
  isAccessible: boolean;
  isReservable: boolean;
  isActive: boolean;
  isMergeable: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// Reservation
interface Reservation {
  id: string;
  restaurantId: string;
  customerId: string;
  branchId: string | null;
  status: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  customerNotes: string | null;
  internalNotes: string | null;
  specialRequests: string | null;
  confirmationCode: string;
  source: string;
  createdBy: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

// Audit Entry
interface AuditEntry {
  id: string;
  organizationId: string;
  module: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string | null;
  restaurantId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// Calendar Exception
interface CalendarException {
  id: string;
  date: string;
  type: string;
  name: string;
  description: string | null;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  createdAt: string;
  updatedAt: string;
}

// Settings
interface RestaurantSettings {
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  weekStartsOn: number;
  taxPercentage: number;
  serviceChargePercentage: number;
  defaultReservationDuration: number;
  reservationBufferMinutes: number;
  allowWalkIns: boolean;
  autoConfirmReservations: boolean;
  maxReservationsPerCustomer: number;
  reservationCancellationHours: number;
}

// Reservation Policy
interface ReservationPolicy {
  defaultReservationDuration: number;
  maxPartySize: number;
  minPartySize: number;
  minAdvanceBooking: number;
  maxAdvanceBooking: number;
  allowWalkIns: boolean;
  autoConfirm: boolean;
  cancellationDeadline: number;
  noShowGracePeriod: number;
  lateCancellationFee: number | null;
  noShowFee: number | null;
}

// Configuration (aggregated restaurant config)
interface RestaurantConfiguration {
  restaurant: Restaurant;
  settings: RestaurantSettings;
  reservationPolicy: ReservationPolicy;
  businessHours: BusinessHours | null;
  calendarExceptions: CalendarException[];
}

// Asset
interface RestaurantAsset {
  id: string;
  type: string;
  name: string;
  url: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Enums (String Constants)

```typescript
// Restaurant Status
type RestaurantStatus = 'active' | 'suspended' | 'archived' | 'inactive';

// Table Status
type TableStatus = 'available' | 'reserved' | 'occupied' | 'cleaning' | 'maintenance' | 'out_of_service' | 'blocked' | 'archived';

// Reservation Status
type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'seated' | 'completed' | 'cancelled' | 'no_show';

// Table Group Status
type TableGroupStatus = 'active' | 'reserved' | 'occupied' | 'released' | 'archived';

// Dining Area Status
type DiningAreaStatus = 'active' | 'inactive' | 'archived';

// Table Type Status
type TableTypeStatus = 'active' | 'inactive' | 'archived';

// Calendar Exception Type
type CalendarExceptionType = 'holiday' | 'special_opening' | 'temporary_closure' | 'event' | 'maintenance' | 'private_event';

// Audit Action
type AuditAction = 'create' | 'update' | 'delete' | 'archive' | 'restore' | 'login' | 'logout' | 'activate' | 'deactivate' | 'assign' | 'revoke';

// Audit Module
type AuditModule = 'restaurant' | 'table' | 'reservation' | 'customer' | 'employee' | 'user' | 'role' | 'permission' | 'auth' | 'audit' | 'notification' | 'organization' | 'branch' | 'settings' | 'system';
```
