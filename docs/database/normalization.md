# Normalization

**Last updated:** 2026-07-04

## Normalization Level: BCNF

All tables in the TableFlow database satisfy **Boyce-Codd Normal Form (BCNF)**, which is a stricter version of 3NF. This ensures minimal redundancy, maximum data integrity, and easier maintenance.

---

## 1NF (First Normal Form)

**Rule:** Every column contains atomic values. Each row is unique. No repeating groups.

### Compliance

| Table | Atomic Columns? | Unique PK? | No Repeating Groups? |
|-------|----------------|------------|---------------------|
| organizations | ✅ | ✅ UUID | ✅ |
| branches | ✅ | ✅ UUID | ✅ |
| users | ✅ | ✅ UUID | ✅ |
| customers | ✅ | ✅ UUID | ✅ |
| reservations | ✅ | ✅ UUID | ✅ |
| tables | ✅ | ✅ UUID | ✅ |
| All others | ✅ | ✅ UUID | ✅ |

**Key decisions ensuring 1NF:**
- **JSON columns** (`customers.preferences`, `settings.value`, `audit_logs.details`) store semi-structured data that MySQL 8 natively supports. They are atomic from the application perspective — the app reads and writes the entire JSON document.
- **Phone numbers** are stored as VARCHAR, not as integers (phone numbers are not numeric values — they contain formatting, extensions, leading zeros).
- **Enums** (`reservations.status`, `notifications.type`) use VARCHAR with application-level validation, not MySQL ENUM type (which creates schema migration issues).

---

## 2NF (Second Normal Form)

**Rule:** Satisfies 1NF. Every non-key column is fully functionally dependent on the entire primary key.

### Compliance

All tables use **single-column UUID primary keys**, so there is no partial dependency risk. The two associative tables (`role_permissions`, `reservation_tables`) use composite primary keys where every column is part of the key — therefore no non-key columns exist that could be partially dependent.

| Table | PK Type | Partial Dependency Risk? |
|-------|---------|------------------------|
| organizations | Single (UUID) | ✅ None |
| branches | Single (UUID) | ✅ None |
| users | Single (UUID) | ✅ None |
| reservations | Single (UUID) | ✅ None |
| tables | Single (UUID) | ✅ None |
| role_permissions | Composite (role_id, permission_id) | ✅ No non-key columns |
| reservation_tables | Composite (reservation_id, table_id) | ✅ No non-key columns |
| All others | Single (UUID) | ✅ None |

---

## 3NF (Third Normal Form)

**Rule:** Satisfies 2NF. No transitive dependency — non-key columns must not depend on other non-key columns.

### Analysis

| Table | Transitive Dependency Check | Status |
|-------|---------------------------|--------|
| **organizations** | All columns depend only on `id` | ✅ |
| **branches** | `timezone` depends on `organization_id`? No — each branch can have a different timezone even within the same org. Columns depend on `id`. | ✅ |
| **users** | `email` is unique but not a determinant for other columns. Columns depend on `id`. | ✅ |
| **customers** | `total_visits`, `total_cancellations`, `total_noshows` are denormalized counters (not transitive dependencies — they are derived but cached for performance). See note below. | ✅* |
| **reservations** | `customer_id` is a FK, not a determinant for other columns. `confirmation_code` is a unique alternate key but all columns depend on `id`. | ✅ |
| **employees** | `employee_code` is a unique alternate key but not a determinant for user/branch data. | ✅ |

### Denormalization Trade-offs

**Deliberate denormalization in `customers`:**
- `total_visits`, `total_cancellations`, `total_noshows` are cached counters to avoid COUNT queries on every customer list page.
- These are updated via triggers or application code when reservations change status.
- Risk: counter drift. Mitigation: nightly reconciliation job or periodic recount.

**Deliberate denormalization in `settings`:**
- Key-value schema stores diverse configurations in JSON format.
- This avoids a wide table with hundreds of nullable setting columns (violating 1NF).
- Acceptable trade-off for flexibility.

---

## BCNF (Boyce-Codd Normal Form)

**Rule:** Satisfies 3NF. For every non-trivial functional dependency X → Y, X must be a superkey.

### Analysis

| Table | Potential Violation | Status |
|-------|-------------------|--------|
| **branches** | Could `phone` determine `name`? No — phone is not guaranteed unique across branches of different organizations. | ✅ |
| **users** | Could `email` → `first_name`? Yes, email is a unique alternate key. But email is a candidate key (could be promoted to PK). BCNF is satisfied because the determinant `email` is a superkey. | ✅ |
| **customers** | Could `email` → `first_name`? Same as users — email is an alternate key, which is a superkey. | ✅ |
| **tables** | `table_number` is unique only within a `branch_id`. So `table_number` alone is not a superkey. The FD `table_number + branch_id → min_capacity, max_capacity` is valid and the determinant is a superkey (composite). | ✅ |
| **business_hours** | The FD `branch_id + day_of_week → open_time, close_time` exists. The determinant `(branch_id, day_of_week)` is a superkey (enforced by unique constraint). | ✅ |

**All tables satisfy BCNF.** No further normalization is required.

---

## Normalization Summary

| Form | Status | Evidence |
|------|--------|----------|
| **1NF** | ✅ Satisfied | Atomic columns, UUID PKs, no repeating groups |
| **2NF** | ✅ Satisfied | Single-column PKs eliminate partial dependency |
| **3NF** | ✅ Satisfied | No transitive dependencies |
| **BCNF** | ✅ Satisfied | Every determinant is a superkey |

---

## When De-Normalization Might Be Considered

| Scenario | Consideration | Decision |
|----------|--------------|----------|
| Report queries joining 6+ tables | Create aggregated views or materialized views | Phase 6 |
| Real-time dashboard requiring sub-second aggregation | Introduce Redis counters | Phase 5 |
| Customer search requiring fuzzy matching | Add full-text indexes (not de-normalization) | Phase 4 |
| Notification log growing too fast for normalization | Archive to analytics database | Phase 7 |

---

## Related Documents

- [table-design.md](./table-design.md) — Column-level design
- [constraints.md](./constraints.md) — Unique constraints enforcing normalization
- [performance.md](./performance.md) — Performance considerations
