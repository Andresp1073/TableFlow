# Enterprise Rate Limiting Engine

## Overview
A provider-agnostic, strategy-based rate limiting engine supporting four algorithms. Designed for enterprise REST APIs with multi-tenant, multi-dimension rate limiting.

## Components

### RateLimitEngine
Central orchestrator. Accepts `RateLimitContext`, resolves the matching policy, dispatches to the configured strategy, and returns a `RateLimitDecision`. Supports metrics collection, logging, and event publishing.

### Strategies (4)
| Strategy | Type | Algorithm | Best For |
|---|---|---|---|
| FixedWindow | `fixed_window` | Counter expires at window boundary | Simple per-minute limits |
| SlidingWindow | `sliding_window` | Weighted estimate across moving window | Burst-aware APIs |
| TokenBucket | `token_bucket` | Tokens refill at constant rate | Traffic shaping, public APIs |
| LeakyBucket | `leaky_bucket` | Constant drain rate | Steady throughput, webhooks |

### RateLimitPolicy
Defines the boundary for a protected resource:
- `name` — unique policy identifier
- `strategy` — one of four strategy types
- `maxRequests` — capacity / threshold
- `windowMs` — time window in milliseconds
- `burstMultiplier` — optional burst allowance (sliding window only)
- `dimensions` — rate limiting scope (user, role, restaurant, tenant, api_key, ip, endpoint)
- `enabled` — toggle on/off without removing the policy

### Five Default Policies
| Policy | Strategy | Limit | Dimensions |
|---|---|---|---|
| `login` | sliding_window | 5/min | ip, user |
| `reservation_api` | sliding_window | 60/min (burst 1.5x) | user, restaurant |
| `public_booking_api` | token_bucket | 30/min | ip |
| `admin_api` | fixed_window | 200/min | user, role |
| `webhook_api` | leaky_bucket | 100/min | api_key |

### RateLimitKeyResolver
Builds cache keys from context dimensions. Supports 7 dimensions. Falls back to `ratelimit:global` when no dimensions match. `resolveWithPolicy()` includes the policy name in the key.

### RateLimitCounter
Adapter over `CacheProvider` with sub-keys for each strategy data type (`:counter`, `:window`, `:token`, `:leaky`). Uses cache TTL for automatic expiry.

### RateLimitContextBuilder
Fluent builder for constructing `RateLimitContext` with all 10 fields.

## Architecture & Design Decisions
- Four strategy classes with a common interface; new strategies implement `RateLimitStrategy`
- Engine calls `strategy.check(key, counter, policy)` — strategies depend only on the counter adapter
- All strategy data stored via `CacheProvider` — no direct storage dependency
- Failed strategy evaluations fall open (allow the request) to avoid cascading failures
- Engine publishes `rate_limit_exceeded` events via `EventPublisher` when configured
- Metrics collector receives per-policy accepted/rejected/remaining counts

## Usage
```
import { RateLimitEngine, FixedWindowStrategy, SlidingWindowStrategy,
  TokenBucketStrategy, LeakyBucketStrategy, RateLimitCounter, RateLimitKeyResolver,
  createPolicy, createRateLimitContext, DEFAULT_POLICIES } from "../platform/index.js";

const engine = new RateLimitEngine({
  strategies: [new FixedWindowStrategy(), new SlidingWindowStrategy(),
    new TokenBucketStrategy(), new LeakyBucketStrategy()],
  keyResolver: new RateLimitKeyResolver(),
  counter: new RateLimitCounter(cacheProvider),
  policies: Object.values(DEFAULT_POLICIES),
});

const context = createRateLimitContext({
  ipAddress: req.ip,
  userId: req.user?.id,
  policyName: "reservation_api",
});

const decision = await engine.evaluate(context);

if (!decision.allowed) {
  res.set("Retry-After", String(decision.retryAfterMs / 1000));
  res.status(429).json({ error: "rate_limit_exceeded", retryAfterMs: decision.retryAfterMs });
}
```

## Test Summary
- 78 tests across 3 suites (strategies, engine, misc)
- Full coverage of all 4 algorithms, engine orchestration, reset, dimension isolation, error handling, and metrics
