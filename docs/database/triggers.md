# Triggers

**Last updated:** 2026-07-04

## Trigger Philosophy

MySQL triggers are used **sparingly** in TableFlow. The primary recommendation is to implement business logic in the **application layer** (Node.js/Express services) rather than in triggers, because:

| Reason | Detail |
|--------|--------|
| **Maintainability** | Application logic is version-controlled, tested, and visible to the entire team. Triggers are invisible to ORM. |
| **Debugging** | Trigger execution is harder to trace and debug. |
| **Performance** | Triggers add overhead to every DML operation. |
| **Portability** | Prisma-compatible — triggers can interfere with Prisma's expected behavior. |

However, triggers are recommended for **audit and data integrity** only — operations that must happen regardless of which application or user modifies the data.

---

## Recommended Triggers

### 1. Trigger: `trg_reservation_audit_insert`

| Attribute | Detail |
|-----------|--------|
| **Event** | AFTER INSERT on `reservations` |
| **Purpose** | Automatically create the first entry in `reservation_status_history` when a reservation is created. |

**Logic:**
```pseudo
INSERT INTO reservation_status_history (reservation_id, from_status, to_status, changed_by, created_at)
VALUES (NEW.id, NULL, NEW.status, NEW.created_by, NOW())
```

**Why a trigger:** Creating a status history entry on reservation creation is a data integrity requirement that must never be missed, regardless of which code path creates the reservation.

### 2. Trigger: `trg_reservation_status_update`

| Attribute | Detail |
|-----------|--------|
| **Event** | AFTER UPDATE on `reservations` (when `status` changes) |
| **Purpose** | Automatically log every status change to `reservation_status_history`. |
| **Note** | Uses `updated_by` column (must-fix Item 5) — every mutation must set `updated_by` to the acting user ID. |

**Logic:**
```pseudo
IF OLD.status <> NEW.status THEN
    INSERT INTO reservation_status_history (reservation_id, from_status, to_status, changed_by, created_at)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.updated_by, NOW());
END IF;
```

**Why a trigger:** The status change audit trail is a non-negotiable business requirement. Application-level logging could be forgotten in some code paths. This trigger guarantees completeness.

### 3. Trigger: `trg_reservation_confirmation_code`

| Attribute | Detail |
|-----------|--------|
| **Event** | BEFORE INSERT on `reservations` |
| **Purpose** | Auto-generate a unique confirmation code if one is not provided. |

**Logic:**
```pseudo
IF NEW.confirmation_code IS NULL THEN
    SET NEW.confirmation_code = generate_random_code();
END IF;
```

**Why a trigger:** Guarantees every reservation has a confirmation code. The generation function can be replaced with application-level generation if needed.

### 4. Trigger: `trg_customer_noshow_counter`

| Attribute | Detail |
|-----------|--------|
| **Event** | AFTER UPDATE on `reservations` (status → NO_SHOW) |
| **Purpose** | Increment the customer's `total_noshows` counter. |

**Logic:**
```pseudo
IF NEW.status = 'NO_SHOW' AND OLD.status <> 'NO_SHOW' THEN
    UPDATE customers SET total_noshows = total_noshows + 1 WHERE id = NEW.customer_id;
    -- Flag customer if threshold exceeded
    IF (SELECT total_noshows FROM customers WHERE id = NEW.customer_id) >= 3 THEN
        UPDATE customers SET is_flagged = TRUE WHERE id = NEW.customer_id;
    END IF;
END IF;
```

**Why a trigger:** The no-show counter must be accurate even if the application code path differs (bulk operations, direct database access, etc.)

### 5. Trigger: `trg_customer_visit_counter`

| Attribute | Detail |
|-----------|--------|
| **Event** | AFTER UPDATE on `reservations` (status → COMPLETED) |
| **Purpose** | Increment the customer's `total_visits` counter. |

**Logic:**
```pseudo
IF NEW.status = 'COMPLETED' AND OLD.status <> 'COMPLETED' THEN
    UPDATE customers SET total_visits = total_visits + 1 WHERE id = NEW.customer_id;
END IF;
```

**Why a trigger:** Counter consistency — ensures the counter always reflects actual completed reservations.

---

## Triggers Explicitly NOT Recommended

| Trigger | Reason Excluded |
|---------|-----------------|
| Email notification triggers | Email sending is an I/O operation that does not belong in a database trigger. Use the application layer. |
| Audit log triggers | We already have a dedicated `audit_logs` table handled by the application for rich context. |
| Table status triggers | Table status (available/occupied) is derived from reservations. Handled at application layer. |
| Cascading soft deletes | Complex logic that belongs in the application layer with proper error handling. |

---

## Trigger Management

| Practice | Policy |
|----------|--------|
| **Naming convention** | `trg_{table}_{action}` |
| **Version control** | Trigger SQL scripts stored in `scripts/triggers/` directory |
| **Documentation** | Every trigger documented here and in the source file |
| **Testing** | Triggers tested as part of integration tests |
| **Monitoring** | Trigger errors logged and monitored |

---

## Related Documents

- [stored-procedures.md](./stored-procedures.md) — Stored procedure recommendations
- [audit-strategy.md](./audit-strategy.md) — Audit trail strategy
- [constraints.md](./constraints.md) — Referential integrity constraints
