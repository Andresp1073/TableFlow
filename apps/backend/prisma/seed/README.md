# Database Seeds

## Purpose

Seed data provides the initial dataset required for development and testing
environments. The seed system is idempotent and can be run multiple times safely.

## Structure

```
prisma/seed/
├── index.ts                  # Main orchestrator — runs seeders in dependency order
├── constants.ts              # Shared constants for statuses and types
├── roles.seed.ts             # 7 system roles
├── permissions.seed.ts       # 103 granular permissions across 12 modules
├── role-permissions.seed.ts  # Permission-to-role mappings (RBAC matrix)
├── organization.seed.ts      # Demo organization (from env vars)
├── settings.seed.ts          # System-wide default settings (7 config groups)
├── admin-user.seed.ts        # Default administrator account (from env vars)
└── README.md                 # This file
```

## Seed Execution Order

Seeds run in strict dependency order to respect foreign key constraints:

| Order | Seed File | Depends On | Records |
|-------|-----------|------------|---------|
| 1 | `permissions.seed.ts` | — | 103 permissions |
| 2 | `roles.seed.ts` | — | 7 roles |
| 3 | `role-permissions.seed.ts` | roles + permissions | ~500+ role-permission assignments |
| 4 | `organization.seed.ts` | — | 1 demo organization |
| 5 | `settings.seed.ts` | — | 7 global settings |
| 6 | `admin-user.seed.ts` | organization + roles | 1 admin user + role assignment |

## Running Seeds

```bash
# Development (default)
pnpm db:seed

# Force seed even if NODE_ENV=production
FORCE_SEED=true pnpm db:seed
```

## Environment Variables

The following variables configure seed behavior:

| Variable | Default | Description |
|----------|---------|-------------|
| `SEED_ADMIN_EMAIL` | `admin@tableflow.io` | Admin login email |
| `SEED_ADMIN_PASSWORD` | `Admin123!` | Admin password (min 8 chars) |
| `SEED_ADMIN_FIRST_NAME` | `System` | Admin first name |
| `SEED_ADMIN_LAST_NAME` | `Administrator` | Admin last name |
| `SEED_ORG_NAME` | `TableFlow Demo` | Demo organization name |
| `SEED_ORG_SLUG` | `tableflow-demo` | Demo organization slug |
| `SEED_ORG_EMAIL` | `demo@tableflow.io` | Demo organization email |

**Note:** The admin password is hashed with bcrypt (12 rounds) before storage.

## Creating a New Seed File

### 1. Create the seed file

```typescript
// prisma/seed/branches.seed.ts
import { PrismaClient } from "@prisma/client";

export async function seedBranches(prisma: PrismaClient): Promise<void> {
  const org = await prisma.organization.findFirstOrThrow({
    where: { slug: "tableflow-demo" },
  });

  await prisma.branch.upsert({
    where: { /* unique field */ },
    update: {},
    create: { /* ... */ },
  });
}
```

### 2. Register in the orchestrator

```typescript
// prisma/seed/index.ts
import { seedBranches } from "./branches.seed";

const SEEDERS = [
  // ... existing seeders ...
  { name: "Branches", fn: seedBranches },  // Add at correct position
];
```

### Conventions

| Rule | Reason |
|------|--------|
| Export a single `seed{Name}` function | Consistent interface for the orchestrator |
| Accept `PrismaClient` as parameter | Reuse same connection, no connection leaks |
| Use `upsert` or find-then-create | Idempotent — safe to run multiple times |
| Use environment variables for secrets | Never hardcode passwords or tokens |
| Log meaningful messages | Helps debug seed failures |
| One domain per file | Keeps seeds modular and testable |

## Idempotency

All seeds must be idempotent. The orchestrator can run any number of times
without producing duplicates or errors. Use these patterns:

```typescript
// Pattern 1: upsert (preferred when unique key is known)
await prisma.role.upsert({
  where: { name: "Admin" },
  update: {},
  create: { name: "Admin", description: "..." },
});

// Pattern 2: find-then-create (when upsert key is compound nullable)
const existing = await prisma.setting.findFirst({
  where: { branchId: null, key: "global.system.config" },
});
if (!existing) {
  await prisma.setting.create({ ... });
}
```

## Production Safety

Seeds are designed for development and staging environments only.
The `NODE_ENV` environment variable should be checked before running
seeds against a production database.

## Seed Data Summary

| Entity | Count | Details |
|--------|-------|---------|
| Roles | 7 | System Admin, Restaurant Admin, Manager, Receptionist, Waiter, Customer, Support |
| Permissions | 103 | Auth (6), Users (9), Roles (6), Restaurants (5), Branches (7), Tables (12), Reservations (16), Customers (9), Notifications (5), Reports (5), Dashboard (2), Settings (6), Audit (4), Organizations (6), System (5) |
| Role-Permissions | ~500+ | Mapped per authorization matrix |
| Organizations | 1 | Configurable via env vars |
| Settings | 7 | System config, reservation defaults, business hours, notifications, guest prefs, security, audit retention |
| Admin User | 1 | System Administrator with full access |
