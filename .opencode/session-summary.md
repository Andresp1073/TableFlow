## Goal
- Complete phase 9.5: implement RestaurantSettings as a separate aggregate with full DDD stack (domain, application, infrastructure, presentation, tests, docs, migration).

## Constraints & Preferences
- Follow existing modular Clean Architecture patterns from the Restaurant module.
- Do NOT store settings inside Restaurant entity — separate aggregate with one-to-one relation.
- Reuse existing value objects (RestaurantTimezone, RestaurantCurrency, RestaurantLanguage) where possible.
- New value objects: DateFormat, TimeFormat, ReservationDuration, TaxPercentage, ReservationBufferMinutes.
- Use Prisma for persistence, Zod for request validation, Vitest for tests.
- Permissions: `restaurants.settings.read`, `restaurants.settings.update`.
- Endpoints: `GET /api/v1/restaurants/:id/settings`, `PUT /api/v1/restaurants/:id/settings`.

## Done
- All 18 restaurant API tests pass (fixed timezone regex and status transition).
- All 253 restaurant unit tests pass.
- Prisma `RestaurantSettings` model added to schema with one-to-one FK to `Organization`.
- Database synced via `prisma db push --accept-data-loss`.
- Migration file created at `prisma/migrations/20260707083000_add_restaurant_settings/`.
- Value objects created: DateFormat, TimeFormat, ReservationDuration, TaxPercentage, ReservationBufferMinutes.
- Domain entity interface (RestaurantSettings) created.
- Repository and Factory interfaces created.
- Custom error (RestaurantSettingsNotFoundError) created.
- Domain events created (RestaurantSettingsCreated, RestaurantSettingsUpdated).
- Application service created (get, create, update, getOrCreate methods).
- DTO, commands, queries, and mapper created.
- Domain validators (CreateRestaurantSettingsValidator, UpdateRestaurantSettingsValidator) created.
- Infrastructure: ConcreteRestaurantSettingsFactory and PrismaRestaurantSettingsRepository created.
- Presentation: routes, controller, Zod validation schemas created.
- Settings router mounted on restaurant router at `/:id/settings`.
- Permission seeds updated with both new permissions.
- Role-permission seeds updated for super-admin and restaurant-owner.
- Value object unit tests: 38 tests, all passing.
- Application service unit tests: 9 tests, all passing.
- API integration tests: 8 tests, all passing.
- Pre-existing `restaurant.api.test.ts` still broken (same DB seed issue — pre-existing).

## Key Decisions
- Settings routes mounted via `router.use("/:id", settingsRouter)` with `{ mergeParams: true }` so the parent `:id` param is available in the child router.
- GET route uses `getOrCreate` (auto-creates settings with defaults on first read).
- PUT route calls `getOrCreate` first, then `update` (upsert-like behavior for first write).
- Changed `uuid` package imports to `crypto.randomUUID()` from `node:crypto` (uuid not in dependencies).
- Fixed relative import paths in settings module files (AppError, auth middleware, EventBus, utils) — settings is one directory deeper than restaurant.
- API test is self-contained (creates its own org, role, user, permissions, JWT token) — doesn't depend on seeded DB.

## Next Steps
1. Update OpenAPI spec with RestaurantSettings schema, endpoints, and examples.
2. Create `docs/restaurants/settings.md` explaining aggregate separation and configuration strategy.
3. Fix pre-existing `restaurant.api.test.ts` (same DB seed issue) or migrate to self-contained approach.

## Relevant Files
- `apps/backend/prisma/schema.prisma`: `RestaurantSettings` model + reverse relation on `Organization`
- `apps/backend/prisma/migrations/20260707083000_add_restaurant_settings/migration.sql`: manually created migration
- `apps/backend/src/modules/restaurant/settings/domain/models/*.ts`: DateFormat, TimeFormat, ReservationDuration, TaxPercentage, ReservationBufferMinutes, RestaurantSettings
- `apps/backend/src/modules/restaurant/settings/domain/repositories/*.ts`: RestaurantSettingsRepository, RestaurantSettingsFactory
- `apps/backend/src/modules/restaurant/settings/domain/events/*.ts`: RestaurantSettingsCreated, RestaurantSettingsUpdated
- `apps/backend/src/modules/restaurant/settings/errors/RestaurantSettingsNotFoundError.ts`
- `apps/backend/src/modules/restaurant/settings/application/services/RestaurantSettingsApplicationService.ts`: core service
- `apps/backend/src/modules/restaurant/settings/application/commands/*.ts`: CreateRestaurantSettingsCommand, UpdateRestaurantSettingsCommand
- `apps/backend/src/modules/restaurant/settings/application/dtos/*.ts`: RestaurantSettingsDTO
- `apps/backend/src/modules/restaurant/settings/application/mappers/*.ts`: RestaurantSettingsMapper
- `apps/backend/src/modules/restaurant/settings/application/validators/*.ts`: CreateRestaurantSettingsValidator, UpdateRestaurantSettingsValidator
- `apps/backend/src/modules/restaurant/settings/infrastructure/repositories/*.ts`: PrismaRestaurantSettingsRepository, ConcreteRestaurantSettingsFactory
- `apps/backend/src/modules/restaurant/settings/presentation/routes/restaurant-settings.routes.ts`: GET/PUT routes with auth, permissions, validation
- `apps/backend/src/modules/restaurant/settings/presentation/controllers/RestaurantSettingsController.ts`
- `apps/backend/src/modules/restaurant/settings/presentation/validation/restaurant-settings.validation.ts`: Zod schemas
- `apps/backend/src/modules/restaurant/presentation/routes/restaurant.routes.ts`: settings router mounted at `/:id`
- `apps/backend/prisma/seed/permissions.seed.ts`: added `restaurants.settings.read`, `restaurants.settings.update`
- `apps/backend/prisma/seed/role-permissions.seed.ts`: assigned new permissions to super-admin and restaurant-owner
- `apps/backend/src/modules/restaurant/settings/tests/value-objects.spec.ts`: 38 tests
- `apps/backend/src/modules/restaurant/settings/tests/application-service.spec.ts`: 9 tests
- `apps/backend/src/modules/restaurant/settings/tests/api.spec.ts`: 8 tests
