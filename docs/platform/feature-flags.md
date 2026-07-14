# Feature Flags Platform

## Architecture

The Feature Flags module provides a provider-agnostic, extensible progressive delivery system. Business modules depend only on the `FeatureFlagProvider` interface (Dependency Inversion Principle).

```
┌──────────────────────────────────────────────────────────────┐
│                     Business Modules                          │
│              (depend only on FeatureFlagProvider)              │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                   FeatureFlagProvider                          │
│              (interface — dependency inversion)                │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                    FeatureFlagManager                          │
│  ┌───────────┬──────────────┬──────────┬─────────────────┐    │
│  │FeatureFlag│ FeatureFlag  │FeatureFlag│ FeatureFlag    │    │
│  │ Evaluator │  Cache       │Decision   │ Context        │    │
│  └─────┬─────┴──────┬───────┴─────┬────┴────────┬───────┘    │
│        │            │             │             │            │
│  ┌─────▼─────┐  ┌───▼────┐  ┌────▼────┐  ┌────▼────────┐   │
│  │ Rule      │  │ Cache  │  │ Enabled │  │ Environment │   │
│  │ Engine    │  │ Found. │  │ /Disabled│  │ /Tenant/   │   │
│  │(Strategy) │  │        │  │ Decision │  │ /User/Role │   │
│  └───────────┘  └────────┘  └─────────┘  └─────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Responsibility |
|---|---|
| **FeatureFlagProvider** | Interface consumed by business modules. Provides `isEnabled`, `getValue`, `evaluate`, `getFlag`, `getAllFlags`. |
| **FeatureFlagManager** | Main orchestrator implementing `FeatureFlagProvider`. Manages flag registration, updates, deletion, evaluation, caching, and event publishing. |
| **FeatureFlagEvaluator** | Evaluates rules against context using the Strategy Pattern. Supports boolean, percentage, date, role, tenant, restaurant, and composite rules. |
| **FeatureFlagContext** | Dynamic evaluation context: environment, tenant, restaurant, user, roles, permissions, API client, request metadata. |
| **FeatureFlagCache** | Wraps Cache Foundation with separate cache keys for flags and evaluated decisions (keyed by context hash). |
| **FeatureFlagDecision** | Immutable result object: enabled/disabled, resolved value, evaluation reason, matched rule, context snapshot. |

## Evaluation Flow

```
                      ┌──────────────┐
                      │  Evaluate    │
                      │  Flag + Ctx  │
                      └──────┬───────┘
                             │
                     ┌───────▼───────┐
                     │ Flag Enabled? │──No──→ Return disabled with reason
                     └───────┬───────┘
                             │ Yes
                     ┌───────▼───────┐
                     │ Sort Rules    │
                     │ by Priority   │
                     └───────┬───────┘
                             │
                     ┌───────▼───────┐
            ┌────────│ Rule Matches? │
            │        └───────┬───────┘
            │ No             │ Yes
            │         ┌──────▼───────┐
            │         │ Rule Enabled?│
            │         └──────┬───────┘
            │          ┌─────┴──────┐
            │          │            │
            │      Enabled      Disabled
            │          │            │
            └──────────┘            │
                    ┌───────────────▼───────┐
                    │ No Rule Matched       │
                    │ → Use Default (false) │
                    └───────────────────────┘
```

## Rule Types

| Type | Config | Description |
|---|---|---|
| **Boolean** | `{ value: boolean }` | Static on/off toggle. Always matches. |
| **Percentage** | `{ percentage: 0-100, sticky?, entityField? }` | Gradual rollout using consistent hashing of entity ID. Supports sticky (deterministic per entity). |
| **Date** | `{ condition: "before" \| "after" \| "between", startDate?, endDate? }` | Time-based activation. Evaluates current time against date boundaries. |
| **Role** | `{ roles: string[], mode: "allow" \| "deny" }` | Role-based gating. Allow = enabled for matching roles. Deny = disabled for matching roles. |
| **Tenant** | `{ tenantIds: string[], mode: "allow" \| "deny" }` | Multi-tenant gating. Allow/deny specific tenants. |
| **Restaurant** | `{ restaurantIds: string[], mode: "allow" \| "deny" }` | Restaurant-level gating. Allow/deny specific restaurants. |
| **Composite** | `{ operator: "AND" \| "OR" \| "NOT", rules: [...] }` | Composes sub-rules using logical operators. AND = all must enable, OR = any must enable, NOT = invert sub-rule. |

### Rule Priority

Rules are evaluated in ascending priority order (lower number = higher priority). The first rule that matches determines the result. Subsequent rules are skipped.

```typescript
[
  { type: "boolean", priority: 10, value: true },   // Evaluated first
  { type: "boolean", priority: 20, value: false },  // Skipped if priority 10 matches
]
```

## Context Resolution

The `FeatureFlagContext` carries all dynamic evaluation data:

```typescript
interface FeatureFlagContext {
  environment?: string;    // e.g., "production", "staging", "development"
  tenantId?: string;       // Multi-tenant identifier
  restaurantId?: string;   // Restaurant-scoped context
  userId?: string;         // User identifier (for percentage stickiness)
  roles?: string[];        // User roles (e.g., ["admin", "editor"])
  permissions?: string[];  // User permissions
  apiClientId?: string;    // API client identifier
  requestMetadata?: Record<string, unknown>;  // Arbitrary request data
  evaluatedAt: Date;       // Timestamp of evaluation
}
```

### Default Context

When no context is provided, defaults are applied:
- `environment` → `process.env.NODE_ENV ?? "development"`
- `evaluatedAt` → current timestamp

### Context Hashing

For cache lookups, context is hashed by joining relevant fields: `environment|tenantId|restaurantId|userId|roles|permissions|apiClientId`.

## Percentage Rollout Strategy

Percentage rollouts use consistent hashing (Bernstein hash) for deterministic assignment:

```
hash = hashCode(flagKey + ":" + entityId)
normalizedHash = abs(hash) % 100
enabled = normalizedHash < percentage
```

- **Sticky**: When `sticky: true` and `entityField` is set (e.g., `userId`), the same entity always gets the same result across evaluations.
- **Entity resolution**: Falls back through `userId` → `tenantId` → `restaurantId`.
- **No entity**: Returns disabled when no entity identifier is available.

## Cache Integration

Reuses the Cache Foundation module with the `ff:` prefix. Two cache tiers:

1. **Flag cache** (`ff:flag:{key}`) — caches registered flag definitions
2. **Decision cache** (`ff:decision:{key}:{contextHash}`) — caches evaluation results per context

Configurable TTL (default: 60s).

```typescript
manager.setCacheProvider(cacheProvider, { ttlMs: 120000, enabled: true });
```

## Events Published

| Event | Trigger |
|---|---|
| `feature_flag.evaluated` | Flag evaluated with context |
| `feature_flag.changed` | Flag definition updated |
| `feature_flag.rollout_started` | Flag transitioned from disabled to enabled |
| `feature_flag.validation_failed` | Flag validation failed during registration/update |

## Usage

### Registration

```typescript
const flagsManager = new FeatureFlagManager();

const flag: FeatureFlag = {
  key: "new-reservation-flow",
  name: "New Reservation Flow",
  type: "boolean",
  defaultValue: false,
  rules: [
    { type: "percentage", priority: 10, percentage: 25, sticky: true, entityField: "userId" },
    { type: "role", priority: 20, roles: ["admin"], mode: "allow" },
  ],
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 1,
};

flagsManager.registerFlag(flag);
```

### Consumption (via FeatureFlagProvider)

```typescript
// Simple boolean check
const isEnabled = await flagsManager.provider.isEnabled("new-reservation-flow", {
  userId: "user-123",
  roles: ["customer"],
});

// Get full decision
const decision = await flagsManager.provider.evaluate("new-reservation-flow", {
  userId: "user-123",
  tenantId: "tenant-acme",
});

console.log(decision.enabled);   // true/false
console.log(decision.reason);    // "Percentage rule: 25% (hash: 18)"
console.log(decision.matchedRule); // The matched rule config
```

### Updates & Rollouts

```typescript
// Increase rollout from 25% to 50%
flagsManager.updateFlag("new-reservation-flow", {
  rules: [
    { type: "percentage", priority: 10, percentage: 50, sticky: true, entityField: "userId" },
    { type: "role", priority: 20, roles: ["admin"], mode: "allow" },
  ],
});
```

### Validation

Flags are validated on registration and update:
- Key must be non-empty and match `^[a-zA-Z][a-zA-Z0-9._-]*$`
- Name is required
- Type must be `boolean`, `string`, or `number`
- Default value is required and must match the declared type
- Each rule must have a priority

## Error Handling

| Error | Code | When |
|---|---|---|
| `FeatureFlagNotFoundError` | FLAG_NOT_FOUND | Flag key not found |
| `FeatureFlagEvaluationError` | FLAG_EVALUATION_FAILED | No evaluator for rule type |
| `FeatureFlagRuleError` | FLAG_RULE_ERROR | Rule evaluation throws |
| `FeatureFlagValidationError` | FLAG_VALIDATION_FAILED | Validation errors during registration/update |

## Testing

The percentage rollout module includes statistical tests that verify:
- 0% rollout never enables any entity
- 100% rollout always enables every entity
- 50% rollout enables approximately half (within 35%-65% tolerance over 1000 samples)
- Same entity gets consistent results (sticky)
- Different flags produce independent distributions
- Falls back through entity ID chain (userId → tenantId → restaurantId)
- Returns disabled when no entity ID is available

## Future Providers

The module is designed to support external feature flag providers. To add LaunchDarkly, Unleash, or custom providers:

1. Implement a provider adapter that maps to `FeatureFlagProvider` interface
2. Add synchronization logic via the `updateFlag` method
3. Use the Event Bus for flag change propagation

```typescript
class LaunchDarklyAdapter implements FeatureFlagProvider {
  // Map LaunchDarkly SDK to FeatureFlagProvider interface
}
```
