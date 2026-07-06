# Prisma — Database Foundation

## Overview

Prisma ORM manages the MySQL database for TableFlow. This document describes
the folder structure, conventions, and workflows.

## Model Count

**22 models** across 7 domains:

| Domain | Models | Tables |
|--------|--------|--------|
| Auth & IAM | User, Role, UserRole, Permission, RolePermission, RefreshToken | 6 |
| Organization | Organization, OrganizationSetting, Branch | 3 |
| Employees | Employee | 1 |
| Tables & Zones | TableZone, RestaurantTable | 2 |
| Customers | Customer | 1 |
| Reservations | Reservation, ReservationTable, ReservationStatusHistory | 3 |
| Notifications | Notification, NotificationTemplate | 2 |
| Settings | Setting | 1 |
| Audit | AuditLog | 1 |
| **Future** | (payments, payment_methods) | — |

## Folder Structure

```
prisma/
├── schema.prisma              # Single source of truth — all 22 models
├── migrations/                # Auto-generated migration files (do not edit manually)
│   └── 20260705_init_database/ # Initial database migration (22 tables)
│       └── migration.sql
├── seed/
│   ├── index.ts               # Seed orchestrator
│   ├── README.md              # Seed documentation
│   └── *.seed.ts              # Per-domain seed files
├── fixtures/                  # Static test fixtures (JSON/CSV for import)
└── README.md                  # This file
```

## Naming Conventions

| Aspect | Convention | Example |
|--------|-----------|---------|
| Model names | PascalCase, singular | `User`, `Branch`, `RestaurantTable` |
| Prisma fields | camelCase | `firstName`, `createdAt` |
| MySQL tables | snake_case (via `@@map`) | `users`, `restaurant_tables` |
| MySQL columns | snake_case (auto from Prisma) | `first_name`, `created_at` |
| Primary keys | `String @id @default(uuid()) @db.Char(36)` | UUID v4 |
| Foreign keys | `String @db.Char(36)` | `branchId String @db.Char(36)` |
| Timestamps | `createdAt` / `updatedAt` | `DateTime @default(now())` |
| Soft delete | `isActive Boolean @default(true)` | Never hard-delete reference data |
| Audit trail | `updatedBy String? @db.Char(36)` | Staff user who modified |

## Migration Workflow

### Development

```bash
# Validate schema before migration
pnpm db:validate

# Create a new migration after schema changes (does NOT apply)
pnpm db:migrate --name describe_change --create-only

# Create AND apply a migration
pnpm db:migrate --name describe_change

# Reset database (drop all tables, re-run all migrations)
pnpm db:reset

# Push schema directly without migration (for prototyping)
pnpm db:push

# View/edit data in browser
pnpm db:studio
```

### Production

```bash
# Validate schema before deployment
pnpm db:validate

# Generate Prisma Client (required after deploy)
pnpm db:generate

# Apply pending migrations (safe for production — wraps in transaction)
pnpm db:deploy
```

### Rollback

Prisma does not support rollback natively. To revert a schema change:

1. Edit `schema.prisma` to the previous state
2. Create a new migration: `pnpm db:migrate --name revert_<change> --create-only`
3. Review the generated SQL
4. Apply it: `pnpm db:deploy`

**Critical rule:** Never edit a migration that has already been applied to any environment.
Always create a new migration to reverse changes.

If a migration has been applied to production and needs to be rolled back urgently:

1. Identify the migration to revert
2. Edit `schema.prisma` to the state before that migration
3. Create a new migration: `pnpm db:migrate --name revert_<feature> --create-only`
4. Review the generated SQL to ensure it only reverses the intended changes
5. Apply via CI/CD pipeline: `pnpm db:deploy`

### Migration Naming

Generated automatically by Prisma with descriptive names when using `--name`.

```
20260705_init_database        # Initial schema creation
20260712_add_customer_tags    # Adding columns
20260715_create_payments      # New models
20260720_revert_customer_tags # Reverting a change
```

Names should be kebab-case, imperatively describe the change, and include
the semantic intent (add_, create_, rename_, drop_, revert_).

## Seed Workflow

```bash
# Run all seeders (development only)
pnpm db:seed

# The seed script refuses to run in production (checks NODE_ENV)
```

## Conventions

- **Single schema file** — All models in one `schema.prisma` for cross-model visibility
- **@@map on every model** — Ensures snake_case table names regardless of model name
- **@@index on query patterns** — Every `@@index` corresponds to a documented query pattern
- **No raw SQL** — All database access through Prisma Client
- **No Prisma enums** — String fields with application-level validation (MySQL compatibility)
- **No soft-delete** — Use `isActive` flag; audit log preserves deletion history
