# Permission Resolver

## Architecture

The Permission Resolver is a dedicated domain service that answers the core authorization question:

> *What permissions does this user effectively have in this restaurant context?*

It sits between the raw RBAC data (user-role assignments, role-permission mappings) and the
permission-checking layer (`AuthorizationService`, `PermissionEvaluator`, middleware guards),
providing a single, cacheable, and optimized resolution pipeline.

```
User-Role Assignments
        │
        ▼
┌──────────────────────────────┐
│  PermissionResolutionService │
│                              │
│  1. Load active user roles   │
│  2. Filter by tenant context │
│  3. Load role permissions    │
│  4. Merge & deduplicate      │
│  5. Cache per request        │
│  6. Return immutable set     │
└──────────────────────────────┘
        │
        ▼
   Resolved Permissions
        │
        ├──► AuthorizationContext.permissions
        ├──► Middleware guards (requirePermission, etc.)
        └──► PermissionEvaluator (hasPermission checks)
```

## Resolution Algorithm

```
Input:  { userId, restaurantId, organizationId }
                  │
                  ▼
    ┌──────────────────────────┐
    │ Check per-request cache  │──────── Cache hit ──► Return cached result
    │ (WeakMap<object, Result>)│
    └──────────┬───────────────┘
               │ Cache miss
               ▼
    ┌──────────────────────────┐
    │ Verify user exists       │── No ──► Throw UserNotFoundError (404)
    └──────────┬───────────────┘
               │ Yes
               ▼
    ┌──────────────────────────────────────────────────────┐
    │ Load active user roles + role permissions (1 query)   │
    │                                                       │
    │  userRole.findMany({                                  │
    │    where: { userId, status: "active",                 │
    │             role: { status: "active" } },             │
    │    include: { role: { include: {                      │
    │      rolePermissions: { include: { permission } }     │
    │    } } }                                              │
    │  })                                                   │
    └──────────────────────────┬───────────────────────────┘
                               ▼
    ┌──────────────────────────────────────────────────────┐
    │ For each user role:                                  │
    │                                                       │
    │   if role.restaurantId === null → ALWAYS include     │
    │     (system role, applies globally)                  │
    │                                                       │
    │   if role.restaurantId === context.restaurantId →    │
    │     include (restaurant role, tenant-scoped)          │
    │                                                       │
    │   if role.restaurantId !== context.restaurantId →    │
    │     skip (different tenant)                          │
    │                                                       │
    │   For each permission in role: add to Set            │
    └──────────────────────────┬───────────────────────────┘
                               ▼
    ┌──────────────────────────┐
    │ Build immutable result   │
    │  - ReadonlySet<string>   │
    │  - Frozen string[]       │
    │  - ResolvedAt timestamp  │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Store in WeakMap cache   │ (if cacheKey provided)
    └──────────┬───────────────┘
               │
               ▼
          Return result
```

## Key Design Decisions

### 1. Single query for batch loading
All user roles, role metadata, role permissions, and permission codes are loaded in a single
Prisma query with nested includes. This eliminates N+1 database round-trips.

### 2. Restaurant-context filtering at resolution time
Unlike the previous approach (which loaded ALL roles and used scope to filter), the resolver
filters by tenant at the query/iteration level:
- **System roles** (`restaurantId = null`) are always included, regardless of restaurant context.
- **Restaurant roles** are only included when their `restaurantId` matches the context's `restaurantId`.

This makes the resolver multi-tenant-aware by design and prepares for future Branch-level
authorization (adding `branchId` filtering in the same pipeline).

### 3. Immutable output
- `permissions` is typed as `ReadonlySet<string>` (immutable, efficient lookup)
- `permissionCodes`, `roleIds`, `roleCodes` are frozen arrays

### 4. Per-request caching via WeakMap
The resolver accepts an optional `cacheKey` (typically the Express request object `req`).
When provided, the result is cached for the lifetime of that object and reused for all
subsequent `resolve()` calls in the same request lifecycle. The cache automatically
clears when the request object is garbage-collected.

## Performance Characteristics

| Aspect | Performance |
|--------|------------|
| Database queries per resolution | 2 (1 for user check, 1 for roles + permissions) |
| Database queries with cache hit | 0 |
| Time complexity (merge) | O(n) where n = total permissions across roles |
| Space complexity | O(p) where p = unique permissions |
| Cache lifetime | Per-request (WeakMap), auto GC |

## Caching Strategy

```
                          Request arrives
                               │
                               ▼
                    ┌─────────────────────┐
                    │ enrichContext runs   │
                    │ (calls resolver)     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Resolver.cacheKey   │
                    │ = req (Express req) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ guards.ts calls     │
                    │ resolvePermissions  │
                    │ → cache hit (req)   │
                    └─────────────────────┘
```

The WeakMap-based per-request cache ensures that:
- The first `resolve()` call in a request hits the database and caches the result.
- All subsequent `resolve()` calls (from guards, AuthorizationService) reuse the cached result.
- No explicit cache invalidation is needed — the cache is tied to the request object's lifetime.
- No cache poisoning across requests — each request has its own WeakMap entry.

## Multi-Tenant Isolation Rules

| Role Type | `restaurantId` | Included when? |
|-----------|---------------|----------------|
| System role | `null` | Always included |
| Restaurant role | `"restaurant-abc"` | Only when `context.restaurantId === "restaurant-abc"` |
| Future: Branch role | `"restaurant-abc"` + `branchId` | Same as restaurant + future branch filter |

## Error Handling

| Scenario | Behavior | Error |
|----------|----------|-------|
| User does not exist | Throws | `UserNotFoundError` (404) |
| User has no role assignments | Returns empty set | None (graceful) |
| User has only inactive roles | Returns empty set | None |
| All roles belong to other tenants | Returns empty set | None |
| Role has no permissions | Role ignored, no permissions added | None |

## Integration Points

### 1. `AuthorizationServiceImpl.createContext()`
Uses the resolver to get resolved permissions, then builds the full `AuthorizationContext`
(including scope determination and `UserRoleInfo` array) from a separate lightweight role query.

### 2. `enrichContext` middleware
When the request cache exists, the middleware uses the resolver (with `req` as cache key)
to get a fresh resolution. When the cache is absent, it delegates to `AuthorizationService.createContext()`.

### 3. `guards.ts` middleware guards
- `requirePermission` — checks `req.authContext` first, then resolver, then cache
- `requireAnyPermission` — same fallback chain
- `requireRole` — uses resolver to get `roleCodes` when authContext not available
- `requireRestaurantAccess` — uses resolver when authContext not available

## Future: Branch-Level Authorization

The `PermissionResolutionContext` interface is designed to be extended with a `branchId`
field. When branch-level authorization is needed:

```typescript
export interface PermissionResolutionContext {
  userId: string;
  restaurantId: string;
  organizationId: string;
  branchId?: string;  // ← future addition
  requestId?: string;
}
```

The resolution algorithm would add a branch filter step: a user role with a `branchId`
would only grant its permissions when `context.branchId` matches.
