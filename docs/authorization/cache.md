# Permission Cache Abstraction

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Application Layer                    │
│                                                        │
│  ┌─────────────────┐   ┌──────────────────────────┐   │
│  │ Guards (middleware) │   │ PermissionResolutionSvc │   │
│  └─────────────────┘   └──────────┬───────────────┘   │
│                                    │                   │
│                    ┌───────────────▼───────────────┐   │
│                    │   CacheInvalidationService    │   │
│                    │   (triggers on role/perm      │   │
│                    │    mutations)                 │   │
│                    └───────────────┬───────────────┘   │
└────────────────────────────────────┼──────────────────┘
                                     │
┌────────────────────────────────────┼──────────────────┐
│          Shared / Cache Layer       │                   │
│                                     ▼                   │
│  ┌──────────────────────────────────────────────┐      │
│  │               CacheProvider                   │      │
│  │          (interface + Memory impl)            │      │
│  │          - get / set / delete / pattern       │      │
│  │          - TTL + sweep + eviction             │      │
│  │          - stats (hits, misses, hit rate)     │      │
│  └──────────────────────────────────────────────┘      │
│                                                        │
│  ┌──────────────────────────────────────────────┐      │
│  │              CacheKeyFactory                  │      │
│  │  "authz:permissions:user:{userId}:{restId}"   │      │
│  │  "authz:roles:user:{userId}:{restId}"         │      │
│  └──────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────┘
```

## Interfaces

### CacheProvider (`shared/cache/domain/CacheProvider.ts`)

Generic key-value cache with TTL support.

| Method | Description |
|--------|-------------|
| `get<T>(key)` | Retrieve value; returns `undefined` if missing or expired |
| `set<T>(key, value, ttlMs?)` | Store with optional TTL (default 5 min) |
| `delete(key)` | Remove single key |
| `clear()` | Remove all entries and reset stats |
| `deleteByPattern(pattern)` | Remove all keys matching glob pattern (`*` wildcard) |
| `exists(key)` | Check if key exists and is not expired |
| `getStats()` | Return hit/miss/size statistics |
| `dispose()` | Clean up sweep timer |

### CacheKeyFactory (`shared/cache/domain/CacheKeyFactory.ts`)

Centralized key builders to prevent hardcoded key strings.

| Method | Key Format |
|--------|------------|
| `userPermissions(userId, restaurantId)` | `authz:permissions:user:{userId}:{restaurantId}` |
| `userRoles(userId, restaurantId)` | `authz:roles:user:{userId}:{restaurantId}` |
| `patterns.allUser(userId)` | `authz:*:user:{userId}:*` |
| `patterns.restaurant(restaurantId)` | `authz:*:{restaurantId}` |

### CacheInvalidationService (`shared/cache/domain/CacheInvalidationService.ts`)

| Method | Usage |
|--------|-------|
| `invalidateUser(userId)` | Clear all cache for user (all restaurants) |
| `invalidateUserForRestaurant(userId, restaurantId)` | Clear user's permission + role caches for specific restaurant |
| `invalidateRestaurant(restaurantId)` | Clear all cache entries for a restaurant |
| `invalidateAll()` | Clear entire cache (used when role permissions change) |

## TTL Strategy

| Content | TTL | Rationale |
|---------|-----|-----------|
| Permission resolution (non-empty) | 5 minutes | Balances freshness with DB load |
| Permission resolution (empty/negative) | 30 seconds | Fast recovery when permissions are granted |
| Roles | 5 minutes | Same window as permissions |

## Invalidation Flow

```
User roles change
  └─ RoleAssignmentServiceImpl.assignRole()
  └─ RoleAssignmentServiceImpl.removeRole()
  └─ RoleAssignmentServiceImpl.replaceUserRoles()
  └─ RoleAssignmentServiceImpl.updateAssignmentStatus()
  └─ RoleAssignmentServiceImpl.updateAssignmentExpiry()
       └─ CacheInvalidationService.invalidateUserForRestaurant()
            └─ CacheProvider.delete("permissions:user:{userId}:{restId}")
            └─ CacheProvider.delete("roles:user:{userId}:{restId}")

Role permissions change
  └─ RolePermissionServiceImpl.assignPermissionToRole()
  └─ RolePermissionServiceImpl.removePermissionFromRole()
  └─ RolePermissionServiceImpl.replaceRolePermissions()
       └─ CacheInvalidationService.invalidateAll()
            └─ CacheProvider.clear()
```

## MemoryCacheProvider

The in-memory implementation uses a `Map<string, CacheEntry>` with:

- **Lazy expiration**: entries are checked on `get()` / `exists()` — expired entries are removed on access
- **Periodic sweep**: a configurable interval (`setInterval`, default 60s, `unref`'d) removes expired entries
- **Eviction**: when `maxEntries` (default 10,000) is reached, expired entries are evicted first, then the oldest entry by creation time
- **Stats tracking**: hits, misses, sets, deletions, invalidations, entry count, estimated memory size

## Metrics

| Metric | Source | Description |
|--------|--------|-------------|
| Cache hits | `CacheStats.hits` | Successful `get()` calls |
| Cache misses | `CacheStats.misses` | `get()` returning undefined |
| Hit rate | `CacheStats.hitRate` | `hits / (hits + misses)` |
| Sets | `CacheStats.sets` | `set()` calls |
| Deletions | `CacheStats.deletions` | Keys removed |
| Invalidations | `CacheStats.invalidations` | Keys removed via `deleteByPattern` |
| Entries | `CacheStats.entries` | Current map size |
| Estimated size | `CacheStats.estimatedSize` | Rough byte estimate of all values |

## Security

- **Tenant isolation**: Cache keys include both `userId` and `restaurantId` — cross-tenant cache poisoning is impossible
- **No cross-user reuse**: Keys are scoped to specific user+restaurant combinations
- **Key format**: Namespaced with `authz:` prefix to avoid collisions with other cache users
- **No cache poisoning**: Invalidation is triggered immediately on any mutation, and negative results have a short 30s TTL

## Future Redis Integration

To switch to Redis:

1. Create `CacheRedisProvider implements CacheProvider` using `ioredis` or `@redis/client`
2. Handle serialization (JSON for objects, convert `Set` to arrays for storage)
3. Use Redis `SCAN` + `DEL` for `deleteByPattern`
4. Use Redis `TTL` / `EXPIRE` for expiration
5. Implement distributed invalidation using Redis Pub/Sub or keyspace notifications

No other code changes needed — the `PermissionResolutionServiceImpl` and invalidation services depend only on the `CacheProvider` interface.

## Files Created

| File | Purpose |
|------|---------|
| `shared/cache/domain/CacheEntry.ts` | Cache entry model with TTL and size |
| `shared/cache/domain/CacheStats.ts` | Statistics interface |
| `shared/cache/domain/CacheProvider.ts` | Generic cache interface |
| `shared/cache/domain/CacheKeyFactory.ts` | Key builder interface |
| `shared/cache/domain/CacheInvalidationService.ts` | Invalidation interface |
| `shared/cache/application/MemoryCacheProvider.ts` | In-memory cache with TTL, sweep, eviction, stats |
| `shared/cache/application/CacheKeyFactoryImpl.ts` | Key builders for permission/role/user caches |
| `shared/cache/application/CacheInvalidationServiceImpl.ts` | Invalidation using pattern matching |
| `shared/cache/application/MemoryCacheProvider.spec.ts` | Unit tests (get/set, TTL, eviction, stats, patterns) |
| `shared/cache/application/CacheKeyFactoryImpl.spec.ts` | Key generation tests |
| `shared/cache/application/CacheInvalidationServiceImpl.spec.ts` | Invalidation and integration tests |
| `shared/cache/application/PermissionResolutionCache.spec.ts` | Integration with PermissionResolutionServiceImpl |

## Testing

- **53** cache-specific unit/integration tests
- **229** pre-existing authorization tests (no regressions)
- Coverage: TTL expiration, cache invalidation, hit/miss behavior, concurrent reads, pattern matching, eviction, stats
