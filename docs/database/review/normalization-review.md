# Normalization Review

**Last updated:** 2026-07-04

## Review Methodology

Each table was evaluated against 1NF, 2NF, 3NF, and BCNF standards. The original design claims BCNF compliance with documented denormalization exceptions.

---

## Table-by-Table Analysis

### organizations
| NF | Status | Evidence |
|----|--------|----------|
| 1NF | ✅ | Atomic columns, UUID PK |
| 2NF | ✅ | Single-column PK eliminates partial dependency |
| 3NF | ✅ | No transitive dependencies |
| BCNF | ✅ | Every determinant (id, name) is a superkey |

**Verdict:** Clean. No issues.

---

### branches
| NF | Status | Evidence |
|----|--------|----------|
| 1NF | ✅ | Atomic columns, UUID PK |
| 2NF | ✅ | Single-column PK |
| 3NF | ✅ | `organization_id` is FK, not determinant of other columns |
| BCNF | ✅ | (organization_id, name) is a superkey |

**Verdict:** Clean. No issues.

---

### users
| NF | Status | Evidence |
|----|--------|----------|
| 1NF | ✅ | |
| 2NF | ✅ | |
| 3NF | ✅ | |
| BCNF | ✅ | `email` is an alternate key (superkey) |

**Verdict:** Clean. No issues.

---

### customers
| NF | Status | Evidence |
|----|--------|----------|
| 1NF | ✅ | JSON `preferences` is atomic from app perspective |
| 2NF | ✅ | |
| 3NF | ⚠️ **Exception** | `total_visits`, `total_cancellations`, `total_noshows` depend on `customer_id` (PK) but are functionally dependent on `reservations` data — they are derived values |
| BCNF | ✅ | `email`, `phone` are alternate superkeys |

**Denormalization Review:**
- `total_visits`: Derived from `COUNT(*) FROM reservations WHERE customer_id = X AND status = 'COMPLETED'`
- `total_cancellations`: Derived from `COUNT(*) WHERE status = 'CANCELLED'`
- `total_noshows`: Derived from `COUNT(*) WHERE status = 'NO_SHOW'`

**Risks:**
1. **Trigger failure**: If the AFTER UPDATE trigger on reservations fails, counters stop incrementing silently.
2. **Batch operations**: If a bulk status update runs (e.g., migration), triggers may not fire, and counters drift.
3. **Data backfill**: When importing historical data, triggers won't run — counters will be zero.

**Recommendation:** Accept the denormalization but require:
- A stored procedure or application-level `reconcileCustomerCounters()` function
- Scheduled monthly execution
- Documentation in the operations runbook

---

### reservations
| NF | Status | Evidence |
|----|--------|----------|
| 1NF | ✅ | |
| 2NF | ✅ | |
| 3NF | ✅ | |
| BCNF | ✅ | `confirmation_code` is alternate superkey |

**Verdict:** Clean. No issues.

---

### tables
| NF | Status | Evidence |
|----|--------|----------|
| 1NF | ✅ | |
| 2NF | ✅ | |
| 3NF | ✅ | |
| BCNF | ⚠️ **Edge case** | `(branch_id, table_number)` is a superkey. Column `zone_id` depends on `branch_id` only in a transitive sense — but `zone_id` is not a FK determinant for other columns. |

**Verdict:** Satisfies BCNF. `capacity` naming is confusing but does not affect normalization.

---

### table_zones
| NF | Status | Evidence |
|----|--------|----------|
| 1NF | ✅ | |
| 2NF | ✅ | |
| 3NF | ✅ | |
| BCNF | ✅ | |

**Verdict:** Clean.

---

### reservation_status_history
| NF | Status | Evidence |
|----|--------|----------|
| 1NF | ✅ | |
| 2NF | ✅ | |
| 3NF | ✅ | |
| BCNF | ✅ | |

**Verdict:** Clean.

---

### notification_templates
| NF | Status | Evidence |
|----|--------|----------|
| 1NF | ✅ | |
| 2NF | ✅ | |
| 3NF | ✅ | |
| BCNF | ✅ | `(branch_id, type)` is superkey |

**Verdict:** Clean.

---

### audit_logs
| NF | Status | Evidence |
|----|--------|----------|
| 1NF | ⚠️ **Exception** | JSON `details` column contains semi-structured data (non-atomic) |
| 2NF | ✅ | |
| 3NF | ✅ | |
| BCNF | ✅ | |

**Denormalization Review:**
- JSON `details` is a deliberate trade-off for flexibility in storing before/after values
- **Risk:** Querying inside JSON values requires `JSON_EXTRACT()` which cannot use standard B-tree indexes
- **Mitigation:** MySQL functional indexes on specific JSON paths if needed
- **Verdict:** Acceptable for audit logging use case

---

### settings
| NF | Status | Evidence |
|----|--------|----------|
| 1NF | ⚠️ **Exception** | JSON `value` column is non-atomic |
| 2NF | ✅ | |
| 3NF | ✅ | |
| BCNF | ✅ | |

**Denormalization Review:**
- Key-value pattern inherently violates 1NF
- **Alternative considered:** `settings` table with typed columns (VALUE_STRING, VALUE_INT, VALUE_BOOLEAN, VALUE_JSON)
- **Recommendation:** Switch to typed columns pattern to avoid JSON parsing overhead and enable type validation

---

## Overall Normalization Score: 9/10

**Strengths:**
- All tables satisfy BCNF except intentional exceptions
- Denormalization is documented and justified
- JSON usage is contained to two low-query-frequency tables

**Weaknesses:**
- Counter drift on customers.reconcile not addressed
- JSON in `settings` adds unnecessary complexity for what are mostly simple scalar values

---

## Recommendations

| ID | Recommendation | Priority |
|----|---------------|----------|
| NORM-01 | Add `reconcileCustomerCounters()` procedure documentation | 🔴 High |
| NORM-02 | Switch `settings.value` to typed columns pattern | 🟡 Medium |
| NORM-03 | Add JSON functional indexes on audit_logs for frequently-queried paths | 🟢 Low |
| NORM-04 | Document trigger failure monitoring for customer counters | 🟡 Medium |
