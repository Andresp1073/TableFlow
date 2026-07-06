# Authorization Middleware

## Overview

The Authorization Middleware is the core RBAC engine that answers the question:  
**"Does this user have permission to perform this action in this context?"**

It enforces permissions, role checks, and multi-tenant scope at the API layer.

## Architecture

```
Request → requireAuth → enrichContext → guard → Controller
                    ↘           ↙
              AuthorizationService
                     ↓
            PermissionEvaluator (Set-based)
```

## How to Protect Routes

### Single Permission Check
```typescript
import { requireAuth } from "../../middlewares/auth.js";
import { requirePermission } from "../authorization/middleware/guards.js";

router.post("/reservations",
  requireAuth,
  requirePermission("reservations.create"),
  createReservation
);
```

### Multiple Permissions (any match)
```typescript
router.get("/orders",
  requireAuth,
  requireAnyPermission(["orders.read", "orders.read_own"]),
  listOrders
);
```

### Role Check
```typescript
router.post("/users/:userId/unlock",
  requireAuth,
  requireRole("super-admin"),
  unlockUserAccount
);
```

### Multi-Tenant Scope
```typescript
router.get("/restaurants/:restaurantId/settings",
  requireAuth,
  requirePermission("settings.read"),
  requireRestaurantAccess("restaurantId"),
  getSettings
);
```

### With Context Enrichment (explicit)
```typescript
import { enrichContext } from "../authorization/middleware/enrichContext.js";

router.use("/api/admin", requireAuth, enrichContext());
```

## Available Guards

| Guard | Purpose | Error |
|---|---|---|
| `requirePermission(code)` | Single required permission | 403 Forbidden |
| `requireAnyPermission(codes[])` | Any of the listed permissions | 403 Forbidden |
| `requireRole(code)` | Required role code | 403 Forbidden |
| `requireRestaurantAccess(param?)` | Multi-tenant scope check | 403 Forbidden |

## Permission Evaluation Flow

1. **`requireAuth`** — extracts JWT, sets `req.userId`, `req.organizationId`, `req.role`, `req.jti`
2. **`enrichContext`** (called implicitly by guards) — loads roles & permissions from DB, builds `AuthorizationContext`, caches per-request
3. **Guard** — checks the cached permission set using `Set.has()` (O(1) lookup)
4. **On match** — calls `next()` to proceed
5. **On miss** — logs security event, calls `next(new ForbiddenError())`

## Caching

Permissions and role codes are cached per-request using a `WeakMap` keyed by the request object.  
This avoids repeated database queries when multiple guards are chained on the same route.

Cached data:
- `permissions: Set<string>` — all permission codes for the current user
- `roleCodes: Set<string>` — all role codes for the current user

## Multi-Tenant Scoping

| Role | Scope | Access |
|---|---|---|
| `super-admin` | `global` | All organizations & branches |
| `platform-admin` | `global` | All organizations & branches |
| `support` | `global` | All organizations & branches |
| `restaurant-owner` | `organization` | Single restaurant |
| `waiter` | `organization` or `branch` | Single restaurant/branch |

## Error Responses

```json
{
  "success": false,
  "error": {
    "code": "auth.forbidden",
    "message": "Missing required permission"
  }
}
```

**Do not expose**:
- Which specific permission was missing
- What permissions the user has
- Existence of resources the user cannot access

## Security Audit Logging

Every authorization decision is logged:

```
Permission granted  → logger.info (userId, permission, requestId)
Permission denied   → logger.warn (userId, permission, reason, requestId)
Role mismatch       → logger.warn (userId, requiredRole, userRoles)
Unauthenticated     → logger.warn (ip, reason)
```

## Best Practices

1. Always use `requireAuth` before authorization guards
2. Prefer permission checks over role checks (more granular)
3. `enrichContext` is called automatically by guards — no need to add it manually unless you need `req.authContext` in controllers
4. Use `requireRestaurantAccess()` to enforce tenant isolation
5. Never expose permission structure in error messages
