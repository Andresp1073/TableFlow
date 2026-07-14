# Distributed Cache Foundation

## Architecture

The Distributed Cache module provides a provider-agnostic caching abstraction layer. Business modules depend only on the `CacheProvider` interface, never on concrete cache implementations.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Cache Module                                  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │                     CacheManager                          │       │
│  │  - get / set / delete / exists / expire                   │       │
│  │  - getOrSet (compute-if-absent)                           │       │
│  │  - mget / mset / mdelete (batch)                          │       │
│  │  - clearByPrefix / clear                                  │       │
│  │  - child (scoped manager with prefix)                     │       │
│  └──────────────────────────┬───────────────────────────────┘       │
│                             │                                        │
│  ┌──────────────────────────┴───────────────────────────────┐       │
│  │                    CacheProvider                          │       │
│  │          (interface — business modules depend here)       │       │
│  └──────────────────────────┬───────────────────────────────┘       │
│                             │                                        │
│  ┌──────────────────────────┴───────────────────────────────┐       │
│  │   NoopCacheProvider    │   Future: Redis / Valkey / ...   │       │
│  │   (in-memory, testing) │   (not implemented)              │       │
│  └────────────────────────┴──────────────────────────────────┘       │
│                                                                      │
│  ┌──────────────────────────┐  ┌────────────────────────────────┐   │
│  │     CacheKeyFactory       │  │  CacheInvalidationCoordinator  │   │
│  │  - forEntity()            │  │  - registerRule()              │   │
│  │  - forRestaurant()        │  │  - invalidateEntity()          │   │
│  │  - forReservation()       │  │  - invalidateModule()          │   │
│  │  - forAvailability()      │  │  - invalidatePattern()         │   │
│  │  - forCalendar()          │  │  - invalidateDependencies()    │   │
│  │  - build()                │  │  - invalidateAll()             │   │
│  │  - fromTemplate()         │  │                                │   │
│  └──────────────────────────┘  └────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │                     CachePolicy                           │       │
│  │  - Absolute expiration                                    │       │
│  │  - Sliding expiration (TTL resets on access)              │       │
│  │  - No expiration                                          │       │
│  │  - Custom TTL                                             │       │
│  └──────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

### Module Location

```
src/modules/platform/cache/
├── index.ts
├── types.ts
├── CacheProvider.ts              # Type re-export
├── CachePolicy.ts                # Policy factories + TTL resolution
├── CacheKeyFactory.ts            # Key generation with templates
├── CacheManager.ts               # Orchestrator wrapping CacheProvider
├── CacheInvalidationCoordinator.ts # Rule-based invalidation
├── NoopCacheProvider.ts          # In-memory implementation for testing
└── tests/
    ├── cache-policy.spec.ts      # 22 tests
    ├── cache-key-factory.spec.ts # 19 tests
    ├── cache-manager.spec.ts     # 24 tests
    └── cache-invalidation.spec.ts # 13 tests
```

## CacheProvider Interface

The central abstraction that all business modules depend on:

```typescript
interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: SetCacheOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttlMs: number): Promise<boolean>;
  clearByPrefix(prefix: string): Promise<number>;
  mget<T>(keys: string[]): Promise<Array<T | null>>;
  mset<T>(entries: Array<{ key: string; value: T }>, options?: SetCacheOptions): Promise<void>;
  mdelete(keys: string[]): Promise<number>;
  clear(): Promise<void>;
  getPolicy?(key: string): Promise<CachePolicy | null>;
  touch?(key: string, ttlMs: number): Promise<boolean>;
}
```

## CacheManager

Orchestrates high-level operations over any `CacheProvider`:

### Core Operations
| Method | Description |
|--------|-------------|
| `get<T>(key)` | Retrieve value (applies sliding window refresh if configured) |
| `set<T>(key, value, policy?)` | Store value with optional policy |
| `delete(key)` | Remove single key |
| `exists(key)` | Check key existence |
| `expire(key, ttlMs)` | Set TTL on existing key |
| `clearByPrefix(prefix)` | Clear all keys matching prefix |

### Cache-Aside Pattern
```typescript
getOrSet<T>(key, factory, policy?)
```
Retrieves cached value if present; otherwise computes via factory, caches it, and returns it. Supports both sync and async factories.

### Batch Operations
| Method | Description |
|--------|-------------|
| `mget<T>(keys)` | Returns `Map<string, T | null>` |
| `mset<T>(entries, policy?)` | Sets multiple key-value pairs |
| `mdelete(keys)` | Deletes multiple keys |

### Scoped Managers
```typescript
const main = new CacheManager(provider);
const session = main.child("session"); // prefixes all keys with "session:"
session.set("abc", data);              // stored as "session:abc"
```

## CachePolicy

Four expiration strategies:

| Policy | Behavior |
|--------|----------|
| `CachePolicy.absolute(ttlMs)` | Entry expires exactly `ttlMs` after creation |
| `CachePolicy.sliding(windowMs)` | TTL resets to `windowMs` on each access (when >50% consumed) |
| `CachePolicy.none()` | Entry never expires |
| `CachePolicy.custom(ttlMs, slidingWindowMs?)` | Flexible combination |

Default TTL: 5 minutes (300,000 ms)

## CacheKeyFactory

Standardized key generation with registered templates:

### Entity Keys
```
restaurant:42
reservation:res-abc
table:t-1
tableGroup:tg-1
waitlist:w-1
menu:m-1
```

### Named Templates
```
availability:{restaurantId}:{date}   → availability:rest-1:2026-07-14
calendar:{restaurantId}:{day}        → calendar:rest-1:2026-07-14
user:session:{sessionId}             → user:session:sess-abc
config:restaurant:{restaurantId}     → config:restaurant:rest-1
```

### Custom Key Building
```typescript
factory.build("report:{type}:{date}", { type: "daily", date: "2026-07-14" });
// → "report:daily:2026-07-14"
```

### Default Factory
`CacheKeyFactory.createDefault()` pre-registers all standard entity and named templates, ready for immediate use.

## CacheInvalidationCoordinator

Rule-based invalidation engine:

### Invalidation Strategies
| Strategy | When It Fires | Method |
|----------|---------------|--------|
| `entity` | Entity type matches context | `invalidateEntity(type, id)` |
| `module` | Module name matches context | `invalidateModule(name)` |
| `pattern` | Pattern matches (fuzzy or exact) | `invalidatePattern(pattern)` |
| `dependency` | Entity type matches, triggers related keys | `invalidateEntity(type, id)` |

### Rule Registration
```typescript
coordinator.registerRule({
  name: "reservation_availability_dep",
  strategy: "dependency",
  entityType: "reservation",
  dependencies: [{ entityType: "reservation", relationship: "affects_availability" }],
  priority: 10,
  getKeys(context) {
    return [`availability:${context.metadata?.restaurantId}:${context.metadata?.date}`];
  },
});
```

### Priority Ordering
Rules are applied in descending priority order (highest priority first). Error collection ensures that a failing rule does not prevent others from executing.

## NoopCacheProvider

In-memory implementation suitable for:
- Unit testing business modules
- Local development without external cache
- Feature toggles where cache is disabled

Supports all `CacheProvider` methods including `getPolicy` and `touch` for sliding window simulation. Auto-evicts expired entries.

## Future Providers

The following providers can be implemented against the `CacheProvider` interface:

| Provider | Strategy | Use Case |
|----------|----------|----------|
| **Redis** | `ioredis` client | Production primary cache |
| **Valkey** | Redis-protocol compatible | Open-source alternative |
| **Memcached** | `memcached` or `memjs` | Simple key-value workloads |
| **In-memory** | `Map` with TTL | Single-process/development |
| **Hybrid** | L1 (memory) + L2 (Redis) | Low-latency with distributed consistency |

## Usage Example

```typescript
import { CacheManager, CacheKeyFactory, CachePolicy, NoopCacheProvider } from "../modules/platform/cache/index.js";

const provider = new NoopCacheProvider();
const cache = new CacheManager(provider);
const keys = CacheKeyFactory.createDefault();

// Standard get/set
await cache.set(keys.forRestaurant("42"), { name: "My Restaurant" });
const restaurant = await cache.get("restaurant:42");

// Cache-aside pattern
const availability = await cache.getOrSet(
  keys.forAvailability("42", "2026-07-14"),
  () => fetchAvailabilityFromDB("42", "2026-07-14"),
  CachePolicy.absolute(60_000),
);

// Scoped cache
const sessionCache = cache.child("session");
await sessionCache.set("sess-abc", { userId: "u-1" });
```

## Design Principles

- **Provider-agnostic**: Business modules depend only on `CacheProvider` interface
- **No business coupling**: Module knows nothing about reservations, restaurants, etc.
- **Clean Architecture**: Concrete cache providers are external implementations
- **SOLID**: Single responsibility per component, open for extension
- **Strict TypeScript**: Full type safety, no `any` types
- **Testability**: NoopCacheProvider for isolated unit tests
