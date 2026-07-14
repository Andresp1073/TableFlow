# Configuration Center

## Overview
A provider-agnostic, schema-driven configuration management module for enterprise SaaS platforms. Supports priority-ordered configuration sources, type coercion, validation, caching, hot reload preparation, and event publishing.

## Architecture

```
Business Module → ConfigurationProvider → ConfigurationManager
                                                │
                      ┌─────────────────────────┼─────────────────────────┐
                      │                         │                         │
               ConfigSource(es)        ConfigValidator           ConfigurationCache
               (priority-ordered)     (schema + custom)         (CacheProvider adapter)
                      │
           ┌──────────┼──────────┐
           │          │          │
      Environment  InMemory    File (future)
```

### ConfigurationManager
Internal orchestrator. Manages sources, validates values against schemas, caches resolved values, publishes events, and notifies change listeners. Exposes a `ConfigurationProvider` for business modules.

### ConfigurationProvider (Public Facade)
Business modules depend only on this interface. Provides:
- `get<T>(key)` — resolve from sources with priority, schema coercion, cache
- `getRequired<T>(key)` — throws if missing
- `getOrDefault<T>(key, default)` — fallback default
- Type-safe accessors: `asString`, `asNumber`, `asBoolean`, `asDuration`, `asArray`, `asObject`
- `getAll()` — merges all sources with priority override
- `refresh(key)` / `refreshAll()` — invalidate cache, re-resolve

## Configuration Sources

| Source | Priority | Description |
|---|---|---|
| EnvironmentSource | 0 (default) | Reads from `process.env` with optional prefix, dotted key conversion, auto-parsing (JSON, booleans, numbers) |
| InMemorySource | configurable | In-memory key-value store for defaults, overrides, testing |

### Priority Order
Sources are ordered by priority (ascending). Lower number = higher priority. First source with a value wins for `get()`. For `getAll()`, higher-priority values override lower-priority ones.

Default recommended layering:
1. Runtime overrides (priority 0)
2. Environment variables (priority 10)
3. Configuration files (priority 50)
4. Database (priority 80)
5. Defaults (priority 100)

## Configuration Types

| Type | Runtime | Coercion |
|---|---|---|
| `string` | `string` | `String(value)` |
| `number` | `number` | `Number(value)` |
| `boolean` | `boolean` | `"true"/"1"/"yes"/"on"` → true |
| `duration` | `DurationConfig` | Parsed from `"30s"`, `"5m"`, `"1h"`, `"2d"` |
| `array` | `unknown[]` | JSON parse, comma-split, or wrapped |
| `object` | `Record<string, unknown>` | JSON parse |
| `enum` | `string` | Validated against `enumValues` |

### DurationConfig
```typescript
interface DurationConfig {
  value: number;
  unit: "ms" | "s" | "m" | "h" | "d";
}
```
Helper functions: `createDuration(value, unit)`, `durationToMs(d)`, `durationToString(d)`, `parseDuration(str)`

## Validation

`ConfigurationValidator` supports per-schema rules:

| Rule | Description |
|---|---|
| `required` | Value must be present and non-null |
| `defaultValue` | Fallback when value is undefined |
| `min` / `max` | Numeric range validation |
| `minLength` / `maxLength` | String length validation |
| `pattern` | Regex pattern validation |
| `allowedValues` | Explicit value whitelist |
| `enumValues` | String enum validation |
| `properties` | Nested object schema validation |
| `itemSchema` | Array item schema validation |
| `validator` | Custom async validator function |

## Caching

`ConfigurationCache` wraps `CacheProvider` from the Cache Foundation. Values are cached after first resolution. Cache is invalidated on `refresh(key)` or `refreshAll()`.

## Hot Reload Preparation

`ConfigurationChangeListener` interface for hot reload:

| Method | Trigger |
|---|---|
| `onConfigChanged(event)` | Single key refreshed |
| `onConfigReloaded(event)` | All config reloaded |
| `onValidationFailed(errors)` | Validation errors during reload |

## Events

| Event Type | Trigger |
|---|---|
| `configuration_changed` | Single config key refreshed |
| `configuration_reloaded` | All config reloaded |
| `configuration_validation_failed` | Validation errors during reload |

## Usage
```typescript
import { ConfigurationManager, InMemorySource, EnvironmentSource } from "../platform/index.js";

const manager = new ConfigurationManager({
  sources: [
    new EnvironmentSource(10, "APP_"),
    new InMemorySource("defaults", 100, {
      "app.port": 3000,
      "app.debug": false,
    }),
  ],
  schemas: [
    { key: "app.port", type: "number", required: true, min: 80, max: 65535 },
    { key: "app.debug", type: "boolean", defaultValue: false },
    { key: "app.log_level", type: "enum", enumValues: ["debug", "info", "warn", "error"], defaultValue: "info" },
  ],
  cacheProvider: myCache,
  logger: myLogger,
  eventPublisher: myEventBus,
});

const provider = manager.provider;

const port = await provider.asNumber("app.port");
const debug = await provider.asBoolean("app.debug");
const logLevel = await provider.getOrDefault("app.log_level", "info");
```

## Extension Points
- **New source types**: Implement `ConfigSource` interface (FileSource, DatabaseSource, VaultSource, FeatureFlagSource)
- **Custom validators**: Pass a `validator` function in schema
- **Change listeners**: Register `ConfigurationChangeListener` for custom hot reload logic
- **Typed config objects**: Use `asObject` + schema `properties` for structured config

## Test Summary
- 89 tests across 5 suites (value, validation, sources, cache, manager)
- Full coverage: type coercion, validation rules, source priority, caching, refresh, events, listeners
