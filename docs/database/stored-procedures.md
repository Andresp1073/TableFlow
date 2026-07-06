# Stored Procedures

**Last updated:** 2026-07-04

## Stored Procedure Philosophy

Stored procedures are **not recommended** for TableFlow. All business logic should reside in the **application layer** (Node.js/Express services). This decision is based on:

| Reason | Detail |
|--------|--------|
| **ORM compatibility** | Prisma is designed for application-level queries. Stored procedures bypass Prisma's type safety. |
| **Version control** | Application code is version-controlled and tested. Stored procedures are harder to track. |
| **Debugging** | Debugging stored procedures is significantly harder than Node.js code. |
| **Portability** | Stored procedures tie the application to MySQL specifically. |
| **Testing** | Unit testing stored procedures requires database setup and teardown. |
| **Performance** | Most business logic does not benefit from being close to the database. |

However, the following procedures are **candidates** if performance requirements justify bypassing the application layer for specific high-volume operations.

---

## Candidate Procedures (Application-Recommended)

### 1. `sp_create_reservation`

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Atomic creation of a reservation with table assignment in a single transaction. |
| **Implementation** | Application service layer (recommended) |

**Logic:**
```
BEGIN TRANSACTION
    1. Validate branch is open at requested time
    2. Validate party size within limits
    3. Find available tables for the requested time
       -- CRITICAL: Use SELECT ... FOR UPDATE to prevent race condition
       -- Two simultaneous requests could otherwise both find the same table "available"
    4. SELECT id FROM tables WHERE branch_id = ? AND is_active = TRUE
       AND id NOT IN (subquery for overlapping reservations)
       AND min_capacity >= ? FOR UPDATE
    5. Assign best available table
    6. Insert reservation record
    7. Insert reservation_tables record(s)
    8. Update customer counters
    9. Insert status history entry
COMMIT
```

**Race condition prevention:** The `SELECT ... FOR UPDATE` in step 4 places an exclusive lock on the candidate table rows. Any concurrent transaction attempting the same operation will wait until this transaction commits, preventing double-booking. This is essential because MySQL does not support exclusion constraints natively.

**Why application layer:** The reservation creation logic involves multiple business rules (overlapping slots, opening hours validation, party size rules) that are better maintained as testable TypeScript code.

### 2. `sp_cancel_reservation`

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Cancel a reservation and release assigned tables. |
| **Implementation** | Application service layer (recommended) |

**Logic:**
```
BEGIN TRANSACTION
    1. Validate reservation exists and is cancelable
    2. Update reservation status to CANCELLED
    3. Release table assignments
    4. Update customer cancellation counter
    5. Insert status history entry
    6. Trigger notification (application)
COMMIT
```

### 3. `sp_generate_daily_report`

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Generate aggregated daily performance data for reporting. |
| **Implementation** | **Stored procedure candidate** |

**Why candidate:** This is a read-only, CPU-intensive aggregation that could benefit from being close to the data. If performance testing shows the application-level aggregation is too slow, implement as a stored procedure.

**Logic:**
```
SELECT
    branch_id,
    date,
    COUNT(*) AS total_reservations,
    SUM(party_size) AS total_covers,
    SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
    SUM(CASE WHEN status = 'SEATED' THEN 1 ELSE 0 END) AS seated_count,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
    SUM(CASE WHEN status = 'NO_SHOW' THEN 1 ELSE 0 END) AS no_show_count,
    SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count
FROM reservations
WHERE date BETWEEN start_date AND end_date
GROUP BY branch_id, date
```

### 4. `sp_search_available_tables`

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Find all tables available for a given time slot on a specific date. |
| **Implementation** | **Stored procedure candidate** |

**Why candidate:** This is the highest-frequency query in the system and has complex date/time overlap logic. If the application-level query becomes a bottleneck, a stored procedure with optimized SQL would be faster.

**Logic:**
```
SELECT t.*, z.name AS zone_name
FROM tables t
LEFT JOIN table_zones z ON t.zone_id = z.id
WHERE t.branch_id = p_branch_id
  AND t.is_active = TRUE
  AND t.id NOT IN (
    SELECT rt.table_id
    FROM reservation_tables rt
    JOIN reservations r ON rt.reservation_id = r.id
    WHERE r.branch_id = p_branch_id
      AND r.date = p_date
      AND r.status IN ('CONFIRMED', 'SEATED')
      AND p_requested_time < ADDTIME(r.time, SEC_TO_TIME(
          (SELECT average_dining_duration FROM branches WHERE id = p_branch_id) * 60
      ))
      AND ADDTIME(p_requested_time, SEC_TO_TIME(
          (SELECT average_dining_duration FROM branches WHERE id = p_branch_id) * 60
      )) > r.time
  )
  AND t.min_capacity >= p_party_size
ORDER BY t.min_capacity ASC
```

---

## Decision Procedure

Use this decision tree to determine whether a procedure should be a stored procedure or application code:

```
Is the operation READ-ONLY?
├── Yes → Is it a high-frequency query (> 1000 calls/hour)?
│       ├── Yes → Consider stored procedure (performance test first)
│       └── No  → Application code (Prisma query)
└── No  → Application code (business logic belongs in service layer)
```

---

## Related Documents

- [triggers.md](./triggers.md) — Trigger recommendations
- [performance.md](./performance.md) — Performance optimization
- [views.md](./views.md) — View-based alternatives for read operations
