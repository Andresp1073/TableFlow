# Restaurant Module Architecture

## Overview

The Restaurant module represents the tenant entity (a restaurant company) in TableFlow's multi-tenant architecture. Every business resource — branches, reservations, customers, employees, roles — belongs to exactly one Restaurant.

The domain entity `Restaurant` maps to the `Organization` Prisma model, which serves as the persistence layer. The domain uses "Restaurant" nomenclature while the database retains `Organization` for backward compatibility.

## Domain Model

### Entity

```typescript
interface Restaurant {
  id: string;
  name: RestaurantName;
  slug: RestaurantSlug;
  legalName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  address: string | null;
  status: RestaurantStatus;
  timezone: RestaurantTimezone;
  currency: RestaurantCurrency;
  language: RestaurantLanguage;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

### Value Objects

| Value Object | Validation |
|---|---|
| `RestaurantName` | 1–255 chars, trimmed |
| `RestaurantSlug` | 1–100 chars, lowercase + hyphens only, no leading/trailing/double hyphens |
| `RestaurantStatus` | One of: `active`, `inactive`, `suspended`, `closing_down` |
| `RestaurantTimezone` | IANA timezone from known list, max 50 chars |
| `RestaurantCurrency` | ISO 4217 3-letter code from supported list |
| `RestaurantLanguage` | ISO 639-1 code (optional `-XX` region) from supported list |

Each value object follows a common pattern:
- **Private constructor** — instantiation goes through static factories
- **`create(value)`** — validates input, throws on invalid
- **`reconstitute(value)`** — creates without validation (for DB reads)
- **`equals(other)`** — value equality comparison

### Status Lifecycle

```
active ──→ inactive
active ──→ suspended ──→ active
active ──→ closing_down (terminal)
inactive ──→ active
```

## Repository Contracts

| Interface | Purpose |
|---|---|
| `RestaurantRepository` | CRUD: `findById`, `findBySlug`, `save`, `update`, `softDelete` |
| `RestaurantQueryRepository` | Queries: `findAllActive`, `findByStatus`, `searchByName`, `countByStatus` |
| `RestaurantValidator` | Uniqueness & state validation before persistence |
| `RestaurantFactory` | Creates domain entities from raw data or validated inputs |

## Domain Service Interfaces

| Interface | Methods |
|---|---|
| `RestaurantDomainService` | `activate`, `deactivate`, `suspend`, `closeDown`, `transferOwnership` |
| `RestaurantValidationService` | `assertIsActive`, `assertNotDeleted`, `assertCanChangeStatus` |
| `RestaurantSlugGenerator` | `fromName`, `ensureUnique` |

## Error Classes

| Error | Status | Code |
|---|---|---|
| `RestaurantNotFoundError` | 404 | `restaurant.not_found` |
| `RestaurantAlreadyExistsError` | 409 | `restaurant.already_exists` |
| `RestaurantInactiveError` | 409 | `restaurant.inactive` |
| `RestaurantSlugAlreadyExistsError` | 409 | `restaurant.slug_already_exists` |
| `InvalidRestaurantStateError` | 422 | `restaurant.invalid_state` |

## Database Mapping

| Domain | Prisma Model |
|---|---|
| `Restaurant` | `Organization` |
| `restaurants` table | `organizations` (via `@@map`) |

The `Organization` Prisma model includes two backward-compatible additions alongside the existing schema:

- **`legalName`** (`String?`, `@db.VarChar(255)`) — legal business name
- **`taxId`** (`String?`, `@db.VarChar(50)`) — tax identification number
- **`website`** (`String?`, `@db.VarChar(500)`) — business website URL
- **`language`** (`String`, `@default("en")`, `@db.VarChar(5)`) — default language
- **`status`** (`String`, `@default("active")`, `@db.VarChar(20)`) — restaurant status
- **`deletedAt`** (`DateTime?`) — soft-delete timestamp

The existing `isActive` field is retained for backward compatibility. Domain logic uses `status` for lifecycle management; `isActive` remains as a legacy flag.

## Module Structure

```
src/modules/restaurant/
  index.ts                          # barrel export
  domain/
    models/                         # entity interface + value objects
      Restaurant.ts
      RestaurantName.ts
      RestaurantSlug.ts
      RestaurantStatus.ts
      RestaurantTimezone.ts
      RestaurantCurrency.ts
      RestaurantLanguage.ts
      index.ts
    repositories/                   # repository contracts
      RestaurantRepository.ts
      RestaurantQueryRepository.ts
      RestaurantValidator.ts
      RestaurantFactory.ts
      index.ts
    services/                       # domain service interfaces
      RestaurantDomainService.ts
      RestaurantValidationService.ts
      RestaurantSlugGenerator.ts
      index.ts
  application/services/             # application services (future)
  infrastructure/
    repositories/                   # Prisma implementations (future)
    services/                       # infrastructure service implementations (future)
  presentation/                     # controllers, middleware, routes (future)
  errors/                           # module-specific error classes
    RestaurantNotFoundError.ts
    RestaurantAlreadyExistsError.ts
    RestaurantInactiveError.ts
    RestaurantSlugAlreadyExistsError.ts
    InvalidRestaurantStateError.ts
    index.ts
  tests/                            # unit tests
    Restaurant.spec.ts
    RestaurantStatus.spec.ts
    RestaurantName.spec.ts
    RestaurantSlug.spec.ts
    RestaurantTimezone.spec.ts
    RestaurantCurrency.spec.ts
    RestaurantLanguage.spec.ts
    errors.spec.ts
    repositories.spec.ts
    services.spec.ts
```
