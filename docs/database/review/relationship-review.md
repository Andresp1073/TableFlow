# Relationship Review

**Last updated:** 2026-07-04

## Relationship Completeness

| Relationship Type | Count in Design | Expected for SaaS Reservation System | Verdict |
|-------------------|----------------|---------------------------------------|---------|
| One-to-Many | 18 | ~16-20 | ✅ Adequate |
| Many-to-Many | 3 | ~3-5 | ✅ Adequate |
| One-to-One | 0 | 0-1 | ✅ No one-to-one needed |
| Self-referential | 0 | 0 | ✅ Not needed |

---

## One-to-Many Relationship Review

### 1. organizations → branches

| Aspect | Assessment |
|--------|------------|
| **Correctness** | ✅ An org has many branches. A branch belongs to one org. |
| **Cascade** | RESTRICT prevents org deletion with active branches. Correct. |
| **Issue** | If an org is deleted, all branches must be deleted or reassigned. No reassignment option exists. |

**Recommendation:** Add a `reassign_branch` workflow for organization mergers.

### 2. branches → reservations

| Aspect | Assessment |
|--------|------------|
| **Correctness** | ✅ A branch receives many reservations. |
| **Cascade** | RESTRICT — cannot delete a branch with reservations. |
| **Issue** | What happens when a branch permanently closes? If `deleted_at` is set on the branch, reservations with future dates become orphaned (the branch FK still resolves, but the branch is marked deleted). |

**Recommendation:** Add a business rule: "When a branch is soft-deleted, cancel all future reservations" with a `cancellation_reason = 'Branch closed'`.

### 3. branches → business_hours

| Aspect | Assessment |
|--------|------------|
| **Correctness** | ✅ 7 records per branch (one per day). |
| **Cascade** | CASCADE — correct. Deleting a branch removes its hours. |

**Issue:** `open_time` and `close_time` are nullable while `is_closed` can be true. What if both `open_time` is null and `is_closed` is false? Inconsistent state.

**Recommendation:** Add business rule validation: if `is_closed = 0` then `open_time` and `close_time` are required. If `is_closed = 1`, they should be null.

### 4. customers → reservations

| Aspect | Assessment |
|--------|------------|
| **Correctness** | ✅ |
| **Cascade** | RESTRICT prevents customer deletion with reservation history. Correct for GDPR — anonymize instead of delete. |

**Issue:** No `cascade` option for GDPR right-to-erasure. The current design requires anonymization, which is correct but not documented in the relationship.

### 5. reservations → reservation_status_history

| Aspect | Assessment |
|--------|------------|
| **Correctness** | ✅ |
| **Cascade** | CASCADE — correct. Deleting a reservation removes its status history. |

**Issue:** In production, reservations are never deleted (only cancelled). CASCADE on this relationship is unlikely to cause accidental data loss, but it's worth noting.

---

## Many-to-Many Relationship Review

### 1. roles ↔ permissions (via role_permissions)

| Aspect | Assessment |
|--------|------------|
| **Correctness** | ✅ Standard RBAC junction table |
| **Leverage** | Neither CASCADE nor RESTRICT specified. |

**Recommendation:** Add CASCADE on both FKs — deleting a role or permission should clean up the junction table. This is safe because the junction table has no other meaning.

### 2. reservations ↔ tables (via reservation_tables)

| Aspect | Assessment |
|--------|------------|
| **Correctness** | ✅ Enables multi-table reservations |
| **Cascade** | reservation_id: CASCADE. table_id: RESTRICT. |

**Issue:** RESTRICT on table_id means a table cannot be deleted if it has any reservation_tables entries (even historical). This is overly restrictive.

**Recommendation:** Change table_id cascade to CASCADE or SET NULL. Historical table assignments should not prevent table deletion. If a table is removed, old reservation assignments should be cleared.

### 3. users ↔ roles (via user_roles)

| Aspect | Assessment |
|--------|------------|
| **Correctness** | ✅ With branch scope (nullable branch_id) |
| **Design Issue** | The `branch_id` is nullable for organization-wide roles. This means a user could have the same role globally AND at a branch, creating duplicate rows. |

**Recommendation:** Add a unique constraint on `(user_id, role_id, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'))` or validate at application layer that no duplicate assignments exist.

---

## Missing Relationships

### M1: Table status change history

| Aspect | Detail |
|--------|--------|
| **Current** | `tables` has `is_active` but no history of status changes |
| **Need** | `table_status_history` to track: available → occupied → cleaning → available |
| **Why** | Audit, analytics (average cleaning time), debugging |
| **Recommendation** | Add `table_status_history(table_id, from_status, to_status, changed_by, timestamp)` |

### M2: Waiter-to-zone assignment

| Aspect | Detail |
|--------|--------|
| **Current** | `reservations.assigned_to` links a waiter to a reservation |
| **Missing** | No link between a waiter and the table zones they serve |
| **Why** | To validate that a waiter can only be assigned to tables in their zone |
| **Recommendation** | Add `waiter_zone_assignments(user_id, zone_id)` table |

### M3: Customer favorite branches

| Aspect | Detail |
|--------|--------|
| **Current** | `customers.preferences` JSON may contain favorite branch |
| **Problem** | JSON is not queryable. Cannot answer "which customers have this branch as favorite?" |
| **Recommendation** | Add `customer_favorite_branches(customer_id, branch_id)` table for direct querying |

---

## Summary

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| Branch closure cancels reservations | 🔴 High | Cancel future reservations on branch soft delete |
| reservation_tables RESTRICT on table_id | 🟡 Medium | Change to CASCADE |
| Duplicate user_roles possible | 🟡 Medium | Add app-level validation |
| No table_status_history | 🟡 Medium | Add entity |
| business_hours inconsistent state | 🟢 Low | Add validation |
| No waiter-zone assignment | 🟢 Low | Add future consideration |
| No customer_favorite_branches | 🟢 Low | Add future consideration |
