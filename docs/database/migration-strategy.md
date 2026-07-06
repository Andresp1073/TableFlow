# Migration Strategy

**Last updated:** 2026-07-05

## Overview

This document defines the migration workflow for TableFlow's Prisma-managed MySQL database across development, staging, and production environments.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Migration Process                   │
├──────────────┬──────────────────┬───────────────────┤
│  Developer   │  CI/CD Pipeline  │  Production DB    │
│  Workstation │                  │                   │
├──────────────┼──────────────────┼───────────────────┤
│ Edit schema  │  pnpm db:deploy  │  Apply migration  │
│ Validate     │  Run seed?       │  Verify health    │
│ Create migr. │  Run tests       │  Rollback if fail │
│ Apply local  │                  │                   │
└──────────────┴──────────────────┴───────────────────┘
```

## Development Workflow

### 1. Schema Changes

```bash
# 1. Edit prisma/schema.prisma

# 2. Validate
pnpm db:validate

# 3. Format (auto-fixes whitespace/ordering)
pnpm db:format

# 4. Create migration (with --create-only to review SQL first)
pnpm db:migrate --name describe_change --create-only

# 5. Review generated SQL in prisma/migrations/<timestamp>_<name>/migration.sql

# 6. Apply to local database
pnpm db:migrate --name describe_change

# 7. Generate Prisma Client
pnpm db:generate
```

### 2. Verifying Changes

```bash
# Check migration history
pnpm db:migrate status

# Open Prisma Studio to inspect data
pnpm db:studio

# Reset local database completely
pnpm db:reset
```

### 3. During Active Development

```bash
# For rapid prototyping (no migration file created):
pnpm db:push

# When schema stabilizes, create a proper migration:
pnpm db:migrate --name finalize_feature --create-only
```

**Important:** Always use `db:migrate` (not `db:push`) when the schema change needs
to be tracked in version control.

## Production Workflow

### 1. Pre-deployment

```bash
# Validate schema in CI/CD
pnpm db:validate

# Generate Prisma Client for the new schema
pnpm db:generate

# Run integration tests against test database
```

### 2. Deployment

```bash
# Apply pending migrations
pnpm db:deploy
```

### 3. Post-deployment

```bash
# Verify migration applied
pnpm db:migrate status

# Run smoke tests

# Monitor error rates and query performance
```

### Production Safety Rules

| Rule | Rationale |
|------|-----------|
| Never use `db:migrate dev` in production | It may prompt for confirmation or reset data |
| Always use `db:deploy` in production | Non-interactive, fails on conflicts |
| Wrap in CI/CD pipeline | Ensures traceability and rollback capability |
| Run `db:validate` before deploy | Catches schema errors before they reach production |
| Backup database before deploying migrations | Enables full recovery if needed |

## Rollback Strategy

### Forward-only migrations (Prisma constraint)

Prisma Migrate does not support `db:migrate rollback`. The strategy for reverting
a schema change is to create a new migration that reverses the previous one.

### Standard Rollback

```bash
# 1. Identify the migration to revert
# 2. Edit schema.prisma to the desired state (before the migration)
# 3. Create a reversal migration
pnpm db:migrate --name revert_<feature> --create-only
# 4. Review the generated SQL
# 5. Commit and deploy
pnpm db:deploy
```

### Emergency Rollback

If a migration causes production issues:

1. **Immediate:** Disable the affected feature via feature flags (no DB change)
2. **Short-term:** Create a new migration that reverses the schema change
3. **Long-term:** Fix the root cause and create a proper migration

### Data Migration Rollback

For migrations that include data transformations:

1. The forward migration should include the reverse logic
2. Create a new migration that:
   - Reverses the schema change
   - Restores the data to its previous state
3. Test thoroughly before applying

## Migration Conventions

### Naming

```
<timestamp>_<imperative_verb>_<feature_or_change>
```

| Pattern | Example |
|---------|---------|
| Initial | `20260705_init_database` |
| Add model | `20260710_create_payments` |
| Add field | `20260712_add_customer_tags` |
| Modify field | `20260715_extend_phone_length` |
| Remove field | `20260720_drop_deprecated_column` |
| Add index | `20260725_add_customer_search_idx` |
| Revert | `20260730_revert_customer_tags` |
| Data migration | `20260801_backfill_customer_tier` |

### Rules

| Rule | Explanation |
|------|-------------|
| One logical change per migration | Easier to review, test, and revert |
| Never edit applied migrations | Always create a new migration to reverse |
| Always review generated SQL | Prisma may not generate optimal SQL in all cases |
| Keep migration files in version control | Enables reproducible deployments |
| Use `--create-only` for complex changes | Review and potentially hand-optimize SQL |

## Deployment Recommendations

### CI/CD Pipeline Integration

```yaml
# GitHub Actions / GitLab CI example steps:
steps:
  - name: Install dependencies
    run: pnpm install

  - name: Validate Prisma schema
    run: pnpm db:validate

  - name: Generate Prisma Client
    run: pnpm db:generate

  - name: Run database migrations
    run: pnpm db:deploy
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}

  - name: Run integration tests
    run: pnpm test
```

### Pre-deployment Checklist

- [ ] Schema validated (`pnpm db:validate`)
- [ ] Migration SQL reviewed
- [ ] Prisma Client regenerated
- [ ] Database backed up
- [ ] Change approved
- [ ] Rollback plan documented

### Post-deployment Monitoring

- [ ] Migration applied successfully
- [ ] Application health checks pass
- [ ] Error rates normal
- [ ] Query performance stable

## ER Diagram Recommendation

Prisma does not generate ER diagrams natively. Recommended approaches:

| Tool | Approach | Best For |
|------|----------|----------|
| **Prisma Studio** | Built-in GUI, visual table browser | Quick inspection |
| **MySQL Workbench** | Reverse-engineer ERD from database | Documentation, stakeholder reviews |
| **dbdiagram.io** | Import SQL DDL | Shareable diagrams, collaboration |
| **Mermaid.js** | Write DSL, render in docs | In-repository documentation |
| **TablePlus / DBeaver** | Visual database explorer | Daily development work |

### Generate ERD from Migration SQL

```bash
# Export DDL from MySQL
mysqldump -u root -p --no-data tableflow > tableflow-schema.sql

# Import into MySQL Workbench:
# File → Open Model → Create EER Model from Database
```

## Environment Strategy

| Environment | Database | Migration Approach |
|-------------|----------|--------------------|
| Local dev | Docker MySQL or local MySQL | `db:migrate dev` / `db:push` |
| CI/CD test | Ephemeral MySQL (Docker) | `db:migrate dev` |
| Staging | Persistent MySQL | `db:deploy` |
| Production | Persistent MySQL (replicated) | `db:deploy` (via CI/CD) |

## Related Documents

- [Database Overview](./database-overview.md)
- [Tables](./table-design.md)
- [Constraints](./constraints.md)
- [Indexes](./indexes.md)
- [Prisma README](../../apps/backend/prisma/README.md)
