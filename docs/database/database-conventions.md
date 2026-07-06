# Database Conventions

**Last updated:** 2026-07-04

## Naming Conventions

### Database

| Rule | Convention | Example |
|------|------------|---------|
| Database name | `snake_case` | `tableflow_prod`, `tableflow_dev` |
| Environment suffix | `_dev`, `_test`, `_prod` | `tableflow_test` |

### Tables

| Rule | Convention | Example |
|------|------------|---------|
| Naming | `snake_case` | `table_zones`, `reservation_status_history` |
| Plural | Always plural | `customers`, `branches`, `notifications` |
| Join tables | Both parent names | `role_permissions`, `reservation_tables` |
| No prefixes | No `tbl_` or `tb_` | `reservations` |
| No abbreviations | Full words | `reservation_statistics` |

### Columns

| Rule | Convention | Example |
|------|------------|---------|
| Naming | `snake_case` | `first_name`, `party_size` |
| No prefixes | No `col_` or `fld_` | `first_name` |
| Boolean | `is_` or `has_` prefix | `is_active`, `is_verified`, `is_closed` |
| DateTime | `_at` suffix | `created_at` |
| Date only | No suffix | `date` |
| Foreign key | `{table_singular}_id` | `customer_id`, `branch_id` |
| Count | `total_` prefix | `total_visits`, `total_cancellations` |
| No reserved words | Avoid MySQL reserved words | `group_name` not `group` |

### Primary Keys

| Rule | Convention |
|------|------------|
| Name | Always `id` |
| Type | UUID v7 (`CHAR(36)`) |
| Generation | Application-level |

### Foreign Keys

| Rule | Convention |
|------|------------|
| Column | `{referenced_table_singular}_id` |
| Name | `FK_{source}_{target}` |

### Indexes

| Type | Convention | Example |
|------|------------|---------|
| Primary | `PRIMARY` | Auto |
| Unique | `uq_{table}_{columns}` | `uq_customers_email` |
| Foreign key | `idx_{table}_{column}` | `idx_reservations_branch` |
| Composite | `idx_{table}_{col1}_{col2}` | `idx_reservations_branch_date` |
| Full-text | `ft_{table}` | `ft_customers_search` |

---

## Timestamp Columns

Every table includes:

| Column | Type | Behavior |
|--------|------|----------|
| `created_at` | `DATETIME(3)` | Set on insert, never modified |
| `updated_at` | `DATETIME(3)` | Auto-updated on every modification |

Soft-delete tables also include:

| Column | Type | Behavior |
|--------|------|----------|
| `deleted_at` | `DATETIME(3)` | NULL = active, value = deleted timestamp |

### Timestamp Rules

| Rule | Rationale |
|------|-----------|
| Millisecond precision `DATETIME(3)` | Enables precise ordering |
| UTC storage only | App converts for display |
| `created_at` never updated | Set once at insert |
| `updated_at` auto-update | MySQL `ON UPDATE` handles this |

---

## Data Types

| Type | Usage |
|------|-------|
| `CHAR(36)` | UUID primary keys |
| `VARCHAR(20)` | Short codes, phone |
| `VARCHAR(100)` | Names |
| `VARCHAR(255)` | Emails, URLs |
| `VARCHAR(500)` | Longer strings |
| `TEXT` | Notes, bodies |
| `TINYINT(1)` | Boolean (`is_*`, `has_*`) |
| `INT` | Counters, numbers |
| `DATE` | Date only |
| `TIME` | Time only |
| `DATETIME(3)` | Timestamps |
| `JSON` | Flexible/config data |
| `DECIMAL(10,2)` | Monetary (future) |

---

## Migration Conventions

| Rule | Convention |
|------|------------|
| Migration name | `{timestamp}_{description}` (Prisma auto) |
| One change per migration | One logical change per migration |
| Backward compatible | Add columns as nullable, populate, then make required |
| Naming | Descriptive: `add_customer_preferences_column` |

---

## General Rules

| Rule | Rationale |
|------|-----------|
| Always `utf8mb4` | Full Unicode support |
| InnoDB engine only | Transactions, FK support |
| No MySQL ENUM | VARCHAR(20) — ENUM breaks Prisma migrations |
| No auto-increment PKs | UUID prevents enumeration, enables distribution |
| No `SELECT *` | Always specify columns |
| No raw SQL string interpolation | Prisma parameterized queries prevent SQL injection |
| All tables have `created_at` + `updated_at` | Mandatory audit fields |
| Foreign keys always indexed | Prevents table-level locks on parent deletes |

---

## Related Documents

- [table-design.md](./table-design.md) — Applied conventions per table
- [constraints.md](./constraints.md) — Constraint naming examples
- [indexes.md](./indexes.md) — Index naming examples
- [normalization.md](./normalization.md) — Normalization rules
