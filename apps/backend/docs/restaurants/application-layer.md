# Restaurant Application Layer

## Overview

The Restaurant Application Layer implements the use cases of the Restaurant module following **lightweight CQRS**, **DDD**, and **Clean Architecture** principles. It sits between the **Domain Layer** (business rules, entities, value objects) and the **Presentation Layer** (controllers, routes).

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                  │
│          (Controllers — NOT YET IMPLEMENTED)         │
├─────────────────────────────────────────────────────┤
│               Application Layer ▲ THIS               │
│  ┌───────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ Commands  │ │ Queries  │ │ Mappers          │    │
│  │ (CQRS)    │ │ (CQRS)   │ │ (Domain ↔ DTO)   │    │
│  └─────┬─────┘ └────┬─────┘ └──────────────────┘    │
│        │            │                                │
│  ┌─────┴────────────┴──────────────────────────┐    │
│  │       RestaurantApplicationService           │    │
│  │  (Orchestrator — Use Case Coordinator)       │    │
│  └─────┬────────────┬────────────────┬──────────┘    │
│        │            │                │                │
│  ┌─────┴─────┐ ┌────┴────┐  ┌───────┴────────┐      │
│  │  IAM/Auth │ │ Domain  │  │  Infrastructure  │      │
│  │  Service  │ │ Layer   │  │  (Prisma Repos)  │      │
│  └───────────┘ └─────────┘  └────────────────┘       │
├─────────────────────────────────────────────────────┤
│                   Domain Layer                        │
│      (Entities, Value Objects, Rules, Events)         │
├─────────────────────────────────────────────────────┤
│               Infrastructure Layer                     │
│      (Prisma ORM, Concrete Repositories, etc.)        │
└─────────────────────────────────────────────────────┘
```

## Use Cases

| Use Case | Command/Query | Permission | Description |
|---|---|---|---|
| Create Restaurant | `CreateRestaurantCommand` | `restaurants.create` | Creates a new restaurant in `draft` status |
| Get Restaurant | `GetRestaurantByIdQuery` | `restaurants.read` | Retrieves a single restaurant by ID |
| List Restaurants | `ListRestaurantsQuery` | `restaurants.read` | Paginated list with filters & sorting |
| Update Restaurant | `UpdateRestaurantCommand` | `restaurants.update` | Updates restaurant details (not status) |
| Archive Restaurant | `ArchiveRestaurantCommand` | `restaurants.archive` | Soft-deletes; only `draft`/`inactive` allowed |
| Activate Restaurant | `ActivateRestaurantCommand` | `restaurants.activate` | `pending`→`active` or `inactive`→`active` |
| Suspend Restaurant | `SuspendRestaurantCommand` | `restaurants.suspend` | Suspends an `active` restaurant |

## Application Flow

```
Request (from controller) → Command/Query → Authorization → Validation → Domain Logic → Persistence → Event → DTO Response

1. Controller receives HTTP request, builds Command/Query and AuthorizationContext
2. ApplicationService.authorize() checks IAM permission via AuthorizationService
3. Validator validates input fields (name, slug, email, etc.)
4. Domain services enforce business rules (uniqueness, status transitions)
5. Repository persists the domain entity
6. EventBus emits domain events for side effects
7. Mapper converts domain entity to DTO for response
```

## Commands

### CreateRestaurantCommand

```typescript
interface CreateRestaurantCommand {
  name: string;             // Required, 1-255 chars
  slug: string;             // Required, lowercase alphanumeric + hyphens
  legalName?: string | null;
  taxId?: string | null;    // 3-50 chars
  email?: string | null;    // Valid email format
  phone?: string | null;    // 6-20 chars, at least 6 digits
  website?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  timezone?: string;        // Default: "UTC"
  currency?: string;        // Default: "USD"
  language?: string;        // Default: "en"
}
```

### UpdateRestaurantCommand

```typescript
interface UpdateRestaurantCommand {
  id: string;               // Required — target restaurant ID
  name?: string;
  slug?: string;
  legalName?: string | null;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  timezone?: string;
  currency?: string;
  language?: string;
}
```

### ArchiveRestaurantCommand

```typescript
interface ArchiveRestaurantCommand {
  id: string;
  deletedBy: string;        // User ID performing the archive
}
```

### ActivateRestaurantCommand

```typescript
interface ActivateRestaurantCommand {
  id: string;
}
```

### SuspendRestaurantCommand

```typescript
interface SuspendRestaurantCommand {
  id: string;
  reason?: string;
}
```

## Queries

### GetRestaurantByIdQuery

```typescript
interface GetRestaurantByIdQuery {
  id: string;
}
```

### ListRestaurantsQuery

```typescript
interface ListRestaurantsQuery {
  page?: number;              // Default: 1
  limit?: number;             // Default: 20, Max: 100
  status?: RestaurantStatusValue;
  search?: string;            // Search by name, slug, or email
  sortBy?: "name" | "slug" | "createdAt" | "updatedAt" | "status";
  sortOrder?: "asc" | "desc"; // Default: "desc"
}
```

## DTOs

### RestaurantDTO

```typescript
interface RestaurantDTO {
  id: string;
  name: string;
  slug: string;
  legalName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  address: string | null;
  status: string;
  timezone: string;
  currency: string;
  language: string;
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  deletedAt: string | null; // ISO 8601
}
```

### RestaurantListDTO

```typescript
interface RestaurantListDTO {
  data: RestaurantDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

## Mapping

### RestaurantMapper (Domain → DTO)

Converts `Restaurant` domain entity (with value objects) to `RestaurantDTO` (plain primitives):

- `restaurant.name.value` → `dto.name`
- `restaurant.slug.value` → `dto.slug`
- `restaurant.taxId?.value ?? null` → `dto.taxId`
- `restaurant.createdAt.toISOString()` → `dto.createdAt`

### PersistenceMapper (Persistence ↔ Domain)

Converts between Prisma `Organization` records and `Restaurant` domain entities:

- `PersistenceMapper.toDomain(record: OrganizationRecord): Restaurant` — Reconstitutes domain entity from database row
- `PersistenceMapper.toPersistence(restaurant: Restaurant): OrganizationRecord` — Flattens domain entity for database write

Value objects are reconstituted using `.reconstitute()` (no validation) for read paths, and `.create()` (with validation) for write paths.

## Validators

| Validator | Purpose |
|---|---|
| `CreateRestaurantValidator` | Validates required fields for creation |
| `UpdateRestaurantValidator` | Validates optional fields for updates |
| `StatusTransitionValidator` | Validates status transition requests |

## Authorization (IAM Integration)

Every use case integrates with the `AuthorizationService.authorize()` method using permission codes in dot notation:

| Use Case | Permission Code |
|---|---|
| Create | `restaurants.create` |
| Read | `restaurants.read` |
| Update | `restaurants.update` |
| Archive | `restaurants.archive` |
| Activate | `restaurants.activate` |
| Suspend | `restaurants.suspend` |

The `AuthorizationContext` (containing userId, organizationId, roles, permissions, scope) is built by middleware in the presentation layer and passed to application services.

## Error Handling

All domain exceptions (e.g., `RestaurantNotFoundError`, `InvalidRestaurantStateError`) propagate upward from the application layer. Infrastructure exceptions (Prisma errors) are **never** exposed — they are caught and translated by the repository implementations.

| Error | HTTP Code | When |
|---|---|---|
| `RestaurantNotFoundError` | 404 | Restaurant ID not found |
| `RestaurantAlreadyExistsError` | 409 | Duplicate email or tax ID |
| `RestaurantSlugAlreadyExistsError` | 409 | Duplicate slug |
| `InvalidRestaurantStateError` | 422 | Invalid status transition |
| `ValidationError` | 400 | Input validation failure |

## Key Files

| File | Purpose |
|---|---|
| `application/services/RestaurantApplicationService.ts` | Use case orchestrator |
| `application/commands/*.ts` | CQRS command interfaces |
| `application/queries/*.ts` | CQRS query interfaces |
| `application/dtos/*.ts` | Data transfer objects |
| `application/mappers/*.ts` | Domain ↔ DTO ↔ Persistence mappers |
| `application/validators/*.ts` | Input validators |
| `infrastructure/repositories/PrismaRestaurantRepository.ts` | Concrete write repository |
| `infrastructure/repositories/PrismaRestaurantQueryRepository.ts` | Concrete read repository (with pagination) |
| `infrastructure/repositories/ConcreteRestaurantFactory.ts` | Domain entity factory |
