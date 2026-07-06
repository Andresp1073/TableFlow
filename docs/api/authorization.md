# Authorization

**Last updated:** 2026-07-04

## Overview

TableFlow uses **RBAC (Role-Based Access Control)** with scope enforcement. Every authenticated request must be authorized for the target resource.

See also:
- [docs/authorization-model.md](../docs/authorization-model.md) — Complete RBAC model
- [docs/roles.md](../docs/roles.md) — Role definitions
- [docs/permission-matrix.md](../docs/permission-matrix.md) — Role-permission mapping

## Authorization Flow

```
Request with JWT
    │
    ▼
1. Extract user_id, role, org_id from JWT
    │
    ▼
2. Resolve role-permissions from cache
    │
    ▼
3. Verify required permission for endpoint
    ├── Missing → 403 Forbidden
    │
    ▼
4. Verify scope (can user access this resource?)
    ├── Wrong org → 403 Forbidden
    ├── Wrong branch → 403 Forbidden
    │
    ▼
5. Execute request
```

## Required Permission Annotation

Each endpoint in the [endpoint-catalog.md](./endpoint-catalog.md) documents its required permission:

```
POST /api/v1/reservations → requires: reservations.create
DELETE /api/v1/branches/{id} → requires: branches.delete
```

### Permission Naming Convention

```
{module}.{action}
```

| Component | Description | Examples |
|-----------|-------------|----------|
| `{module}` | Resource module | `reservations`, `customers`, `branches` |
| `{action}` | Operation | `create`, `read`, `update`, `delete`, `assign`, `cancel` |

## Scope Enforcement

### Organization Scope

Users can only access resources within their own organization:

| Resource | Scope Field |
|----------|-------------|
| Reservations | `reservations.branch.organization_id` |
| Customers | `customers.branch.organization_id` |
| Tables | `tables.branch.organization_id` |

### Branch Scope

Users with branch-scoped roles can only access resources at their assigned branches.

| Permission Type | Scope |
|----------------|-------|
| `org_admin` | All branches in org |
| `branch_manager` | Assigned branch only |
| `receptionist` | Assigned branch only |
| `waiter` | Assigned branch only |

## JWT Claims for Authorization

```json
{
  "sub": "user-uuid",
  "role": "branch_manager",
  "scope": "organization:org-uuid",
  "branchIds": ["branch-uuid-1", "branch-uuid-2"],
  "permissions": [
    "reservations.create",
    "reservations.read",
    "reservations.update",
    "reservations.cancel",
    "customers.read"
  ],
  "iat": 1704067200,
  "exp": 1704068100
}
```

| Claim | Description |
|-------|-------------|
| `sub` | User UUID |
| `role` | Role identifier |
| `scope` | Organization scope |
| `branchIds` | Branch-level scope (empty = all) |
| `permissions` | Resolved permissions for quick lookup |

## Permission Check Middleware

```typescript
// Pseudocode — implementation in Express middleware
function requirePermission(permission: string) {
  return (req, res, next) => {
    const { permissions, branchIds } = req.user;

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'auth.forbidden',
          message: 'Insufficient permissions',
          details: { requiredPermission: permission }
        }
      });
    }

    // Scope check — if branchId param present, verify access
    if (req.params.branchId && !branchIds.includes(req.params.branchId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'auth.scope',
          message: 'No access to this branch',
          details: { branchId: req.params.branchId }
        }
      });
    }

    next();
  };
}
```

## Permission Catalog

| Module | Permissions |
|--------|-------------|
| **Reservations** | `reservations.create`, `reservations.read`, `reservations.update`, `reservations.delete`, `reservations.cancel`, `reservations.confirm`, `reservations.checkin`, `reservations.checkout`, `reservations.noshow`, `reservations.assign_table`, `reservations.list`, `reservations.search_availability`, `reservations.auto_assign`, `reservations.manage_recurring`, `reservations.add_notes`, `reservations.manage_walkin`, `reservations.override_block` |
| **Customers** | `customers.create`, `customers.read`, `customers.update`, `customers.delete`, `customers.merge`, `customers.flag`, `customers.list`, `customers.add_notes`, `customers.export` |
| **Tables** | `tables.create`, `tables.read`, `tables.update`, `tables.delete`, `tables.assign`, `tables.list`, `tables.release`, `tables.update_status`, `tables.merge`, `tables.split`, `tables.disable`, `tables.configure_layout` |
| **Branches** | `branches.create`, `branches.read`, `branches.update`, `branches.delete`, `branches.list`, `branches.configure_hours`, `branches.configure_policies` |
| **Users** | `users.create`, `users.read`, `users.update`, `users.delete`, `users.list`, `users.disable`, `users.enable`, `users.change_role`, `users.invite` |
| **Roles** | `roles.create`, `roles.read`, `roles.update`, `roles.delete`, `roles.list`, `roles.assign` |
| **Reports** | `reports.view`, `reports.export`, `reports.view_dashboard`, `reports.configure_metrics`, `reports.schedule` |
| **Settings** | `settings.view`, `settings.read`, `settings.update`, `settings.update_general`, `settings.update_reservation_policies`, `settings.update_notification_preferences`, `settings.update_business_hours`, `settings.manage_integrations` |
| **Notifications** | `notifications.send`, `notifications.view_log`, `notifications.configure_templates`, `notifications.configure_preferences`, `notifications.retry` |
| **Audit** | `audit.read`, `audit.read_sensitive`, `audit.export`, `audit.configure_retention` |
| **Dashboard** | `dashboard.view`, `dashboard.customize` |
| **Organizations** | `organizations.create`, `organizations.read`, `organizations.update`, `organizations.delete`, `organizations.list`, `organizations.manage_subscription` |
| **System** | `system.view_health`, `system.manage_backup`, `system.manage_recovery`, `system.view_logs`, `system.configure_global` |

## Cross-References

- [endpoint-catalog.md](./endpoint-catalog.md) — Per-endpoint permission requirements
- [error-catalog.md](./error-catalog.md) — `auth.forbidden`, `auth.scope` error codes
- [request-response-standards.md](./request-response-standards.md) — 403 response format
