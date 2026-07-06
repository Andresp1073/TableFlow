# Performance

**Last updated:** 2026-07-04

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Reservation creation | < 200ms p95 | Application monitoring |
| Availability search | < 100ms p95 | Application monitoring |
| Dashboard load | < 500ms p95 | Application monitoring |
| Customer search | < 300ms p95 | Application monitoring |
| Daily report generation | < 2 seconds | Application monitoring |
| Database query (simple) | < 10ms | Slow query log |
| Database query (aggregate) | < 100ms | Slow query log |
| Concurrent connections | 200+ | Connection pool monitoring |

---

## Expected Growth

| Year | Reservations | Customers | Tables | Active Branches |
|------|-------------|-----------|--------|-----------------|
| Year 1 | 500,000 | 50,000 | 4,000 | 200 |
| Year 2 | 2,000,000 | 200,000 | 12,000 | 600 |
| Year 3 | 5,000,000 | 500,000 | 24,000 | 1,200 |

**Monthly reservation growth:** ~40,000 (Year 1) → ~420,000 (Year 3)

---

## Optimization Strategy

### 1. Query Optimization

| Rule | Application |
|------|-------------|
| **Select only needed columns** | Never `SELECT *` — use Prisma `select` or `include` with specific fields |
| **Use Prisma eager loading** | Use `include` instead of lazy-loading in loops |
| **Batch operations** | Use `createMany`, `updateMany` for bulk operations |
| **Raw queries for complex aggregations** | Prisma `$queryRaw` for reports and analytics |
| **Avoid N+1** | Always eager-load related entities |

### 2. Index Optimization

See [indexes.md](./indexes.md) for complete index design.

**Critical indexes for performance:**

```sql
-- Dashboard: reservations by branch and date
INDEX idx_reservations_branch_date (branch_id, date)

-- Availability search: overlapping reservation detection
INDEX idx_reservations_branch_date_status (branch_id, date, status)

-- Availability search: overlapping reservation detection (critical)
INDEX idx_reservations_branch_date_status_time (branch_id, date, status, time)

-- Customer history
INDEX idx_reservations_customer (customer_id, date)

-- Notification processing
INDEX idx_notifications_pending (status, created_at)
```

### 3. Connection Pooling

| Configuration | Value | Rationale |
|---------------|-------|-----------|
| Prisma connection limit | 50 | Increased from 10 for 200+ concurrent users; matches review recommendation |
| MySQL `max_connections` | 200 | Account for pool + admin + batch jobs |
| Connection timeout | 30 seconds | Fail fast on unavailable database |
| Wait timeout | 300 seconds | Production workload |

**Monitoring:** Connection pool utilization should stay below 80%.

---

## Partitioning Recommendations

### Table: reservations

| Attribute | Detail |
|-----------|--------|
| **Partition type** | RANGE on `date` column |
| **Partition size** | Monthly |
| **Rationale** | 5M+ rows in Year 3. Most queries filter by date (daily dashboard, weekly reports). Monthly partitions allow partition pruning for date-based queries. |
| **Implementation** | **Implement from day one** — adding partitioning to an existing table with millions of rows requires a full table rebuild. Set up at creation time to avoid migration pain. |

```sql
-- Monthly partitioning strategy — implement from day one
-- Pre-create 24 months of partitions (2 years ahead)
PARTITION BY RANGE (YEAR(date) * 100 + MONTH(date)) (
    PARTITION p2025_07 VALUES LESS THAN (202508),
    PARTITION p2025_08 VALUES LESS THAN (202509),
    PARTITION p2025_09 VALUES LESS THAN (202510),
    PARTITION p2025_10 VALUES LESS THAN (202511),
    PARTITION p2025_11 VALUES LESS THAN (202512),
    PARTITION p2025_12 VALUES LESS THAN (202601),
    PARTITION p2026_01 VALUES LESS THAN (202602),
    PARTITION p2026_02 VALUES LESS THAN (202603),
    PARTITION p2026_03 VALUES LESS THAN (202604),
    PARTITION p2026_04 VALUES LESS THAN (202605),
    PARTITION p2026_05 VALUES LESS THAN (202606),
    PARTITION p2026_06 VALUES LESS THAN (202607),
    PARTITION p2026_07 VALUES LESS THAN (202608),
    PARTITION p2026_08 VALUES LESS THAN (202609),
    PARTITION p2026_09 VALUES LESS THAN (202610),
    PARTITION p2026_10 VALUES LESS THAN (202611),
    PARTITION p2026_11 VALUES LESS THAN (202612),
    PARTITION p2026_12 VALUES LESS THAN (202701),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

**Partition management:** Add new partitions quarterly via a cron job or migration script. Archive or drop old partitions (> 12 months for audit_logs) instead of DELETE to avoid index fragmentation and performance degradation.

### Table: audit_logs

| Attribute | Detail |
|-----------|--------|
| **Partition type** | RANGE on `created_at` |
| **Partition size** | Monthly |
| **Rationale** | 10M+ rows in Year 3. Most audits queries are time-bounded. Old partitions can be archived easily. |
| **Implementation** | Implement from day one — same pattern as reservations. Pre-create 24 monthly partitions. |

### Table: reservation_status_history

| Attribute | Detail |
|-----------|--------|
| **Partition type** | RANGE on `created_at` |
| **Partition size** | Monthly |
| **Rationale** | 15M+ rows in Year 3 (largest table). Same pattern as audit_logs. Partitioning enables efficient cleanup of old records via partition drop instead of DELETE. |
| **Implementation** | Implement from day one — pre-create 24 monthly partitions. |

---

## Race Condition Prevention

### Reservation Double-Booking

MySQL does not natively support exclusion constraints (PostgreSQL-only). To prevent two customers from booking the same table simultaneously:

**Required pattern — always use `SELECT ... FOR UPDATE` within a transaction:**

```sql
START TRANSACTION;

-- Lock the candidate table rows — concurrent transactions will wait
SELECT t.id, t.min_capacity, t.max_capacity
FROM tables t
WHERE t.branch_id = ?
  AND t.is_active = TRUE
  AND t.id NOT IN (
    SELECT rt.table_id
    FROM reservation_tables rt
    JOIN reservations r ON rt.reservation_id = r.id
    WHERE r.branch_id = ?
      AND r.date = ?
      AND r.status IN ('CONFIRMED', 'SEATED')
      AND ? < ADDTIME(r.time, SEC_TO_TIME(? * 60))
      AND ADDTIME(?, SEC_TO_TIME(? * 60)) > r.time
  )
  AND t.min_capacity >= ?
FOR UPDATE;

-- Insert reservation + reservation_tables
-- Commit releases the lock
COMMIT;
```

**Key points:**
- The `FOR UPDATE` lock is held until the transaction commits
- All availability-checking code paths (user-facing availability widget, staff booking, walk-in) must use this pattern
- Run within a `REPEATABLE READ` or `READ COMMITTED` isolation level
- Keep the transaction short — lock tables for the minimum time needed

---

## Caching Opportunities

### Application-Level Cache

| Data | Cache Key | TTL | Strategy |
|------|-----------|-----|----------|
| Role-permissions | `role:{id}:permissions` | 1 hour | Cache-aside, invalidate on role change |
| Branch configuration | `branch:{id}:config` | 5 minutes | Cache-aside |
| Business hours | `branch:{id}:hours` | 1 hour | Cache-aside |
| Table floor plan | `branch:{id}:floorplan` | 5 minutes | Cache-aside |

### Query Cache (MySQL)

MySQL 8 query cache is **deprecated**. The application must implement caching at the API layer instead.

### Redis (Future)

When in-memory caching becomes insufficient:

| Cache Target | Rationale |
|-------------|-----------|
| Available time slots | Most frequent query — 30-second TTL |
| Active reservation dashboard | 10-second TTL for real-time feel |
| Daily aggregates | Pre-computed report cache |

---

## Query Optimization Examples

### Bad Query (N+1 Problem)

```pseudo
# N+1 queries — AVOID
reservations = SELECT * FROM reservations WHERE branch_id = ? AND date = ?
for each reservation:
    customer = SELECT * FROM customers WHERE id = reservation.customer_id
```

### Good Query (Eager Loading)

```pseudo
# Single query with JOIN
reservations = SELECT r.*, c.name, c.phone, c.email
FROM reservations r
JOIN customers c ON r.customer_id = c.id
WHERE r.branch_id = ? AND r.date = ?
ORDER BY r.time
```

### Aggregate Query (Report)

```pseudo
# Efficient daily aggregation
SELECT
    DATE(created_at) as day,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'NO_SHOW' THEN 1 ELSE 0 END) as no_shows,
    AVG(party_size) as avg_party
FROM reservations
WHERE branch_id = ?
  AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY day
```

---

## Slow Query Log Configuration

```ini
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-queries.log
long_query_time = 0.5  # Log queries taking > 500ms
log_queries_not_using_indexes = 1
```

**Monitoring:** Review slow query log weekly. Optimize or index any query appearing regularly.

---

## Performance Testing

| Test Type | Tool | Frequency | Target |
|-----------|------|-----------|--------|
| Load testing | k6 or Artillery | Before each release | 10K concurrent users |
| Query benchmarking | `EXPLAIN ANALYZE` | During development | All queries < 50ms |
| Index usage analysis | `sys.schema_unused_indexes` | Monthly | Remove unused indexes |
| Connection pool test | Custom script | Quarterly | Verify connection limits |

---

## Related Documents

- [indexes.md](./indexes.md) — Index design and justification
- [scalability.md](../architecture/scalability.md) — Application scaling strategy
- [backup-strategy.md](./backup-strategy.md) — Backup performance considerations
