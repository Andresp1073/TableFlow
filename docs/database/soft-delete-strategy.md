# Soft Delete Strategy

**Last updated:** 2026-07-04

## Philosophy

Soft delete marks records as deleted without physically removing them. This preserves historical data integrity, enables recovery, and maintains referential integrity for audit and reporting purposes.

---

## Tables That Support Soft Delete

| Table | Why Soft Delete | Recovery Window |
|-------|----------------|-----------------|
| organizations | Tenant data — deleting removes all branches, tables, reservations, and customer data | 30 days |
| branches | Branch may be temporarily closed; data should be preserved for historical reporting | 30 days |
| users | Preserve reservation history (created_by references) and audit trail | 30 days |
| customers | Customers have reservation history — hard delete would break referential integrity | 90 days |
| tables | Historical reservation assignments must remain valid | 30 days |
| employees | Employment records for historical reporting | 90 days |

---

## Tables That Do NOT Support Soft Delete

| Table | Reason |
|-------|--------|
| reservations | Soft delete on reservations is handled via status (CANCELLED). A cancelled reservation remains in the table. |
| reservation_status_history | Immutable audit trail — never deleted. |
| audit_logs | Immutable — never deleted (archived after retention). |
| notifications | Notification logs are archived after retention, not soft-deleted. |
| business_hours | Replaced, not deleted. Old hours are updated, new records created if needed. |
| holiday_hours | Historical holiday data may be useful for analytics. Kept but marked as past. |
| refresh_tokens | Cleaned up by expiration, not soft-deleted. |
| roles | System roles cannot be deleted. Custom roles are hard-deleted if unused. |
| permissions | Immutable — permissions are never deleted, only deprecated. |
| table_zones | If unused, hard-deleted. If has tables, reassign before deleting. |

---

## Implementation

### Column Convention

Every soft-deletable table has:

```
deleted_at DATETIME(3) NULL  -- NULL = active, value = deletion timestamp
```

### Query Pattern

All application queries for soft-deletable tables must include:

```typescript
// Prisma query pattern for soft-delete
const activeBranches = await prisma.branches.findMany({
  where: { deleted_at: null, organization_id: orgId },
});
```

### Soft Delete Operation

```typescript
// Application-level soft delete
async function softDeleteBranch(id: string): Promise<void> {
  await prisma.branches.update({
    where: { id },
    data: { deleted_at: new Date() },
  });

  await auditService.log('branch.delete', 'branch', id, {
    action: 'soft_delete',
    timestamp: new Date(),
  });
}
```

---

## Recovery Strategy

| Recovery Scenario | Method | Complexity |
|-------------------|--------|------------|
| Accidental soft delete | Set `deleted_at = NULL` | Low |
| Data corruption | Restore from backup (point-in-time recovery) | High |
| Customer requests deletion (GDPR) | Anonymize PII fields, keep record | Medium |

### Self-Service Recovery

For restorations within the recovery window:

```typescript
async function restoreCustomer(id: string): Promise<void> {
  await prisma.customers.update({
    where: { id },
    data: { deleted_at: null },
  });
}
```

---

## Hard Delete Policy

Soft-deleted records are **permanently deleted** after the recovery window expires:

| Table | Recovery Window | Cleanup Strategy |
|-------|----------------|------------------|
| organizations | 30 days | Archive all related data, then hard delete |
| branches | 30 days | Hard delete after org cleanup |
| users | 30 days | Anonymize before hard delete |
| customers | 90 days | Anonymize PII (GDPR compliance), keep anonymized record |
| tables | 30 days | Hard delete |
| employees | 90 days | Hard delete |

### Cleanup Schedule

A scheduled job runs monthly to:

1. Identify soft-deleted records past their recovery window.
2. For customers: **anonymize** PII (name becomes "Deleted User", email becomes unique hash).
3. For customers: keep the anonymized record for referential integrity.
4. For other tables: hard delete the record.

---

## GDPR / CCPA Compliance

For "right to erasure" requests:

| Step | Action |
|------|--------|
| 1 | Identify all customer data across tables |
| 2 | Soft delete customer profile |
| 3 | Anonymize PII fields (`first_name`, `last_name`, `email`, `phone`) |
| 4 | Keep the record for reservation history integrity |
| 5 | Log the erasure request in audit_logs |

---

## Query Performance Impact

| Issue | Mitigation |
|-------|------------|
| Every query must filter `deleted_at IS NULL` | Composite indexes on `(deleted_at, business_columns)` |
| `deleted_at IS NULL` has low selectivity | Include in composite indexes with high-selectivity lead column |
| Reporting needs historical data | Reports intentionally query both active and deleted records |

### Index Recommendation for Soft Delete

```sql
-- Instead of a separate index on deleted_at alone,
-- include it in composite indexes:
CREATE INDEX idx_branches_org_active ON branches(organization_id, deleted_at);
CREATE INDEX idx_tables_branch_active ON tables(branch_id, deleted_at);
```

---

## Related Documents

- [table-design.md](./table-design.md) — `deleted_at` columns in each table
- [backup-strategy.md](./backup-strategy.md) — Backup and recovery procedures
- [audit-strategy.md](./audit-strategy.md) — Audit trail for deletions
