# Index Review

**Last updated:** 2026-07-04

## Index Coverage Assessment

The original design defines 40+ indexes. This review evaluates coverage, necessity, and impact.

---

## Critical Missing Indexes

### M1: `reservations (branch_id, date, status, time)`

| Aspect | Detail |
|--------|--------|
| **Why needed** | Availability search is the most frequent query: "Find tables available on [date] at [time] at [branch]" |
| **Current** | `idx_reservations_branch_date(branch_id, date)` — missing `status` and `time` |
| **Impact** | MySQL filters by branch + date using the index, then filters status and time with a table scan of matching rows. At 5M rows, this is 100K+ rows scanned per query. |
| **Storage** | ~100 MB additional (on 5M rows, 4 UUIDs + 1 date + 2 small VARCHARS) |
| **Recommendation** | **Add immediately.** This is the single most impactful index for system performance. |

### M2: `reservations (branch_id, date, time)`

| Aspect | Detail |
|--------|--------|
| **Why needed** | Calendar views showing reservations ordered by time |
| **Current** | Sorted at application layer without index support |
| **Impact** | Filesort on every calendar query. At high concurrency, filesort temp tables on disk |
| **Recommendation** | Add to avoid filesort for the most common ordering pattern |

### M3: `customers (last_name, first_name, email)`

| Aspect | Detail |
|--------|--------|
| **Why needed** | Customer search is the second-most frequent operation |
| **Current** | Only `idx_customers_name(last_name)` exists |
| **Impact** | Searching by `first_name` only, or by partial email, does not use any index |
| **Recommendation** | Replace single-column index with composite covering common search patterns |

### M4: `audit_logs (created_at, action)`

| Aspect | Detail |
|--------|--------|
| **Why needed** | Audit log browsing — sorted by time, filtered by action |
| **Current** | Separate indexes on `created_at` and `action` |
| **Impact** | MySQL can use one index but must filter the other condition manually. Range queries on `created_at` with `action = X` will scan many rows |
| **Recommendation** | Add composite index for common audit browsing patterns |

### M5: `reservation_tables (table_id, assigned_at)`

| Aspect | Detail |
|--------|--------|
| **Why needed** | "Show reservation history for this specific table" |
| **Current** | Only `(reservation_id, table_id)` composite PK + single `(table_id)` index |
| **Impact** | History queries sorted by `assigned_at` require filesort |
| **Recommendation** | Add composite for table-specific timeline queries |

---

## Unnecessary / Redundant Indexes

| Index | Assessment | Recommendation |
|-------|-----------|----------------|
| `idx_customers_name(last_name)` | Replaced by composite `(last_name, first_name, email)` | Drop after creating composite |
| `idx_reservations_date` | Very low selectivity — 365 days for 5M rows = 13,699 rows per day avg. Rarely used alone without branch_id | Consider dropping or keeping for admin queries |
| `idx_reservations_customer(customer_id)` | Already has FK index. Redundant if FK is already indexed | No action needed — FK index may be enough |
| `idx_notifications_type` | Low selectivity (4 values). Only useful combined with status or date | Drop or replace with composite |

---

## Index Storage Impact Estimation

| Table | Current Indexes | Added Indexes | Estimated Index Size (Year 3) |
|-------|----------------|---------------|------------------------------|
| reservations | 8 | +2 | ~800 MB (was ~600 MB) |
| customers | 5 | +1 (replace 1) | ~120 MB (was ~80 MB) |
| audit_logs | 4 | +1 | ~1 GB (was ~900 MB) |
| reservation_tables | 2 | +1 | ~700 MB (was ~500 MB) |

**Total additional storage:** ~500 MB across all tables. Acceptable given the query performance gain.

---

## Index Maintenance

| Index | Write Overhead | Query Benefit | Net Value |
|-------|---------------|---------------|-----------|
| `(branch_id, date, status, time)` | High (4 columns on insert) | Critical (most frequent query) | ✅ High |
| `(branch_id, date, time)` | Medium (3 columns) | High (calendar views) | ✅ High |
| `(last_name, first_name, email)` | Medium (3 columns) | High (customer search) | ✅ High |
| `(created_at, action)` | Medium (2 columns) | Medium (audit browsing) | ✅ Medium |
| `(table_id, assigned_at)` | Medium (2 columns) | Medium (table history) | ✅ Medium |

All indexes are justified — the write overhead is acceptable relative to query benefit.

---

## Execution Plan Review

### Sample: Availability Search Query

```sql
-- Current index: idx_reservations_branch_date(branch_id, date)
EXPLAIN SELECT r.id FROM reservations r
WHERE r.branch_id = 'abc'
  AND r.date = '2026-07-04'
  AND r.status IN ('CONFIRMED', 'SEATED')
  AND r.time BETWEEN '18:00' AND '21:00';
```
**Without new index:** Using `idx_reservations_branch_date` → 13,000 rows scanned → filtered by status + time → 30 rows returned

**With new index `(branch_id, date, status, time)`:** Using the new index → index seek to exact rows → 30 rows returned directly

**Improvement:** ~99.8% reduction in rows scanned

---

## Recommendations

| ID | Action | Priority | Storage Cost |
|----|--------|----------|--------------|
| IDX-01 | Add `reservations(branch_id, date, status, time)` | 🔴 Critical | ~100 MB |
| IDX-02 | Add `reservations(branch_id, date, time)` | 🟡 High | ~80 MB |
| IDX-03 | Replace `customers(last_name)` with `(last_name, first_name, email)` | 🟡 High | ~40 MB (replace) |
| IDX-04 | Add `audit_logs(created_at, action)` | 🟡 Medium | ~120 MB |
| IDX-05 | Add `reservation_tables(table_id, assigned_at)` | 🟢 Medium | ~60 MB |
| IDX-06 | Drop `idx_notifications_type` if composite not planned | 🟢 Low | -15 MB |
