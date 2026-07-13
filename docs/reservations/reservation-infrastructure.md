# Reservation Infrastructure Layer (Phase 12.3)

## Architecture

The infrastructure layer implements the domain repository and factory interfaces using Prisma ORM. It bridges the domain model to the MySQL database while keeping Prisma concerns isolated from the domain and application layers.

```
Reservation Infrastructure Layer
├── Prisma Schema           → Reservation model (with customerId nullable, tableGroupId)
├── ConcreteReservationFactory   → Implements ReservationFactory (create + reconstitute)
├── PrismaReservationRepository  → Implements ReservationRepository
├── DI Wiring              → Manual dependency injection factory functions
└── Tests                  → Factory, repository, and integration verification
```

## Prisma Schema Changes

The existing `Reservation` model was modified to align with the domain model:

| Change | Before | After |
|--------|--------|-------|
| `customerId` nullable | `String` (required) | `String?` (optional) |
| `tableGroupId` added | — | `String? @db.Char(36)` |
| Customer FK on delete | `RESTRICT` | `SET NULL` |
| Organization opposite | missing `tableGroups` | added `tableGroups TableGroup[]` |

## ConcreteReservationFactory

Implements `ReservationFactory` with two methods:

### `create(data: CreateReservationData): Reservation`
- Generates UUID via `randomUUID()` for new `id`
- Wraps primitives in domain Value Objects (via `.create()` factory methods)
- Defaults `status` to `pending` if not provided
- Defaults `customerId`, `tableId`, `tableGroupId` to `null`
- Defaults `notes`, `specialRequests` to `null`
- Sets `createdAt`, `updatedAt` to current time
- Sets `cancelledAt` to `null`

### `reconstitute(data: ReconstituteReservationData): Reservation`
- Uses Value Object `.reconstitute()` static methods (no validation — assumes data is clean from DB)
- Wraps raw dates back into `ReservationDate`, `ReservationTimeRange`, etc.

### Domain ↔ Prisma Mapping

| Domain Field | Prisma Field | Direction |
|-------------|-------------|-----------|
| `restaurantId` | `organizationId` | → (write) |
| `reservationNumber.value` | `confirmationCode` | bidirectional |
| `date.value` | `reservationDate` | bidirectional |
| `timeRange.startTime` | `startTime` | bidirectional |
| `timeRange.endTime` | `endTime` | bidirectional |
| `tableId` | `tableAssignments[0].tableId` | bidirectional (only first table) |
| `tableGroupId` | `tableGroupId` | bidirectional |
| `source.value` | `source` + `walkIn` (boolean) | → (write: walkIn=true if walk_in) |

## PrismaReservationRepository

Implements `ReservationRepository` — all 6 methods from the interface:

### Save
```typescript
async save(reservation: Reservation): Promise<Reservation>
```
- Maps domain → Prisma record, creating the record and optionally a `ReservationTable` entry
- Uses `organizationId = reservation.restaurantId` (domain concept maps to tenant ID)
- Sets `walkIn = true` when `source.value === "walk_in"`
- Returns reconstituted domain object

### Update
```typescript
async update(reservation: Reservation): Promise<Reservation>
```
- Deletes all existing `ReservationTable` entries
- Re-creates with updated table assignment
- Uses Prisma transaction implicitly (single `update` call)

### FindById / FindByIdAndRestaurant
```typescript
async findById(id: string): Promise<Reservation | null>
async findByIdAndRestaurant(id: string, restaurantId: string): Promise<Reservation | null>
```
- Queries Prisma with `include: { tableAssignments: { select: { tableId: true } } }`
- Extracts `tableId` from the first `tableAssignment` entry
- Returns `null` if not found

### FindByRestaurantId
```typescript
async findByRestaurantId(restaurantId: string): Promise<Reservation[]>
```
- Filters by `organizationId`
- Ordered by `createdAt: "desc"`

### FindByFilters
```typescript
async findByFilters(filters: ReservationListFilters): Promise<Reservation[]>
```
- Builds dynamic `where` clause from filters (status, date, customerId)
- Always includes `organizationId` from `restaurantId`

## Transaction Boundaries

Each method on the repository represents a single atomic operation. For operations requiring multiple steps (e.g., update with deleteMany + create), Prisma handles them within a single database interaction.

For application-level transactions spanning multiple repositories (e.g., create reservation + update table status), the Prisma transaction API should be used at the service level via `prisma.$transaction()`.

## Dependency Injection

### Factory functions in `infrastructure/di/index.ts`:

```typescript
// Creates the Prisma-backed repository
createReservationRepository(prisma: PrismaClient): PrismaReservationRepository

// Creates the fully-wired application service
createReservationApplicationService(deps: ReservationModuleDependencies): ReservationApplicationService
```

### `ReservationModuleDependencies` interface:

| Dependency | Type | Required |
|-----------|------|----------|
| `prisma` | `PrismaClient` | Yes |
| `authService` | `AuthorizationService` | Yes |
| `eventBus` | `EventBus` | Yes |
| `auditService` | `AuditService` | Yes |
| `customerRepository` | `CustomerRepository` | No (future use) |
| `cacheInvalidator` | `ReservationCacheInvalidator` | No |

## Error Handling

- **Prisma exceptions** are NOT translated at the repository level (consistent with existing module pattern)
- The application service translates domain errors (e.g., `ReservationNotFoundError`)
- Infrastructure errors (DB connection, constraint violations) propagate as Prisma errors

## Testing

111 tests total (60 domain + 37 application + 14 infrastructure):

- **Factory tests (4)**: create with all fields, create without optionals, reconstitute, custom status
- **Repository tests (10)**: save (2), update (1), findById (2), findByIdAndRestaurant (1), findByRestaurantId (1), findByFilters (3)
