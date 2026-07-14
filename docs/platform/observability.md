# Observability Foundation

## Architecture

The Observability module provides abstract, provider-agnostic interfaces for logging, metrics, tracing, and health checks. It is designed as a pure abstraction layer — no external providers are coupled. All concrete implementations (OpenTelemetry, Prometheus, Datadog, Sentry, etc.) are intended to implement these interfaces without modifying the abstractions.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Observability Module                          │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │    Logger     │  │   Metrics    │  │   Tracing    │  │  Health │ │
│  │  - Console    │  │  - Counter   │  │  - Span      │  │  - App  │ │
│  │  - Noop       │  │  - Gauge     │  │  - Tracer    │  │  - DB   │ │
│  │  - Structured │  │  - Histogram │  │  - NoopTracer│  │  - Cache│ │
│  │  - Child      │  │  - Timer     │  │  - Inject/   │  │  - Queue│ │
│  │               │  │  - Collector │  │    Extract   │  │  - Ext  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────┬─────┘ │
│         │                 │                 │                │        │
│         └─────────────────┴─────────────────┴────────────────┘        │
│                              │                                        │
│                    Provider Implementations                           │
│              (OpenTelemetry, Prometheus, Datadog, etc.)               │
└──────────────────────────────────────────────────────────────────────┘
```

### Module Location

```
src/modules/platform/observability/
├── types.ts                        # Core interfaces and types
├── index.ts                        # Barrel exports
├── logger/
│   ├── Logger.ts                   # BaseLogger abstract class
│   ├── ConsoleLogger.ts            # JSON + pretty-print implementation
│   ├── NoopLogger.ts               # Silent implementation
│   └── index.ts
├── metrics/
│   ├── Counter.ts                  # Counter metric implementation
│   ├── Gauge.ts                    # Gauge metric implementation
│   ├── Histogram.ts                # Histogram with configurable buckets
│   ├── Timer.ts                    # Timer with start/end and measure()
│   ├── NoopMetricsCollector.ts     # In-memory collector implementation
│   └── index.ts
├── tracing/
│   ├── Span.ts                     # Span implementation
│   ├── SpanContext.ts              # Context creation and validation
│   ├── Tracer.ts                   # DefaultTracer with inject/extract
│   ├── NoopTracer.ts               # Silent tracer implementation
│   └── index.ts
├── health/
│   ├── HealthCheck.ts              # BaseHealthCheck abstract class
│   ├── HealthStatus.ts             # Factory and aggregation helpers
│   ├── HealthAggregator.ts         # Composite health check runner
│   ├── checks/
│   │   ├── ApplicationHealthCheck.ts
│   │   ├── DatabaseHealthCheck.ts
│   │   ├── CacheHealthCheck.ts
│   │   ├── QueueHealthCheck.ts
│   │   └── ExternalServiceHealthCheck.ts
│   └── index.ts
└── tests/
    ├── logger.spec.ts              # 26 tests
    ├── metrics.spec.ts             # 21 tests
    ├── tracing.spec.ts             # 29 tests
    └── health.spec.ts              # 23 tests
```

## Logging

### Logger Interface

The `Logger` interface supports structured logging with the following context fields:

| Field | Type | Description |
|-------|------|-------------|
| `traceId` | `string` | Distributed tracing ID |
| `requestId` | `string` | Request tracking ID |
| `correlationId` | `string` | Cross-service correlation ID |
| `userId` | `string` | Authenticated user identifier |
| `restaurantId` | `string` | Restaurant context identifier |
| `operation` | `string` | Operation name |
| `duration` | `number` | Operation duration in ms |
| `error` | `{ name, message, stack }` | Error details |
| `metadata` | `Record<string, unknown>` | Arbitrary structured data |

### Log Levels

- `DEBUG` — Detailed diagnostic information
- `INFO` — General operational information
- `WARN` — Warning conditions
- `ERROR` — Error conditions that require attention
- `FATAL` — Critical errors causing shutdown

### ConsoleLogger

Outputs structured JSON by default. Supports:

- **JSON mode** (default): Each log entry is a single JSON line (`stdout` for DEBUG/INFO/WARN, `stderr` for ERROR/FATAL)
- **Pretty mode**: Human-readable format with key-value context
- **Level filtering**: Configurable minimum level
- **Child loggers**: Merges context from parent with new context

```typescript
const logger = new ConsoleLogger(
  { restaurantId: "rest-1" },
  LogLevel.INFO,
  false, // JSON mode
);

logger.info("Reservation created", {
  reservationId: "res-123",
  partySize: 4,
  duration: 42,
});

const child = logger.child({ userId: "user-abc" });
child.warn("Slow query detected", { operation: "findTables", duration: 1500 });
```

### NoopLogger

Silent implementation that discards all log entries. Useful for tests or when logging is disabled.

## Metrics

### Metric Types

| Type | Interface | Description |
|------|-----------|-------------|
| Counter | `{ inc, reset, collect }` | Monotonically increasing counter (requests, errors) |
| Gauge | `{ set, inc, dec, reset, collect }` | Point-in-time value (active users, memory) |
| Histogram | `{ observe, reset, collect }` | Distribution of values (latency, payload size) |
| Timer | `{ start, measure, observe, reset, collect }` | Duration measurement wrapper |

### MetricsCollector

Factory interface for creating and managing metrics:

```typescript
interface MetricsCollector {
  createCounter(name, help, labelNames?): Counter;
  createGauge(name, help, labelNames?): Gauge;
  createHistogram(name, help, labelNames?, buckets?): Histogram;
  createTimer(name, help, labelNames?): Timer;
  getMetrics(): MetricsSnapshot;
  clear(): void;
}
```

### NoopMetricsCollector

In-memory implementation that stores metrics in maps. `getMetrics()` returns a `MetricsSnapshot` with all current values. `clear()` resets all metrics.

### Histogram Buckets

Default buckets: `[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]` (seconds)

## Tracing

### Span Lifecycle

```
createSpanContext() ──► Span (recording)
  ├── setAttribute(key, value)
  ├── addEvent(name, attributes)
  ├── setStatus({ code, message })
  ├── recordError(error)
  └── end() ──► Span (non-recording)
```

### Tracer Interface

| Method | Description |
|--------|-------------|
| `startSpan(name, options?)` | Create and start a new span |
| `startActiveSpan(name, fn, options?)` | Create span, execute fn, end span automatically |
| `withSpan(parent, name, fn)` | Create child span from parent context |
| `inject(context, carrier)` | Inject trace context into propagation carrier |
| `extract(carrier)` | Extract trace context from propagation carrier |

### W3C Trace Context

The `inject` method uses the W3C Trace Context format (`traceparent` header: `00-{traceId}-{spanId}-{flags}`). The `extract` method parses this format for distributed trace propagation.

### SpanContext

```typescript
interface SpanContext {
  traceId: string;       // 32-char hex trace identifier
  spanId: string;        // 16-char hex span identifier
  parentSpanId?: string; // Parent span reference
  isRemote?: boolean;    // Whether context was propagated from remote service
  traceFlags?: number;   // W3C trace flags (1 = sampled)
  traceState?: string;   // Vendor-specific trace state
}
```

## Health Checks

### HealthCheck Interface

```typescript
interface HealthCheck {
  readonly name: string;
  check(): Promise<HealthCheckResult>;
}
```

### Built-in Checks

| Check | Dependency | Configuration |
|-------|-----------|---------------|
| `ApplicationHealthCheck` | — | name, version, uptime, memory |
| `DatabaseHealthCheck` | `ping(): Promise<boolean>` | name, ping, timeout |
| `CacheHealthCheck` | `ping(): Promise<boolean>` | name, ping, timeout |
| `QueueHealthCheck` | `ping(): Promise<boolean>` | name, ping, timeout |
| `ExternalServiceHealthCheck` | `ping(): Promise<{ reachable, latency? }>` | name, ping, timeout, degradationThresholdMs |

### Status Levels

| Status | Meaning |
|--------|---------|
| `healthy` | Component operating normally |
| `degraded` | Component working but with reduced performance |
| `unhealthy` | Component not functioning |

### HealthAggregator

Composite runner that aggregates multiple health checks:

```typescript
const aggregator = new HealthAggregator();

aggregator.register(new ApplicationHealthCheck({ name: "api", version: "1.0.0" }));
aggregator.register(new DatabaseHealthCheck({ ping: () => db.$queryRaw`SELECT 1` }));

const allResults = await aggregator.checkAll();
const grouped = await aggregator.checkAllGrouped();
const overall = await aggregator.getStatus();
```

## Future Integrations

### Logging Providers
- **OpenTelemetry SDK** — Export logs via OTLP
- **Datadog** — Forward structured logs to Datadog API
- **Sentry** — Capture error-level logs as Sentry events
- **AWS CloudWatch** — Log group/stream integration

### Metrics Providers
- **Prometheus** — Expose metrics via `/metrics` endpoint
- **OpenTelemetry Metrics** — Export via OTLP
- **Datadog Metrics** — Submit via DogStatsD
- **AWS CloudWatch** — PutMetricData integration

### Tracing Providers
- **OpenTelemetry SDK** — Full OTLP exporter (Jaeger, Zipkin, Tempo)
- **Datadog APM** — Trace propagation via Datadog headers
- **AWS X-Ray** — Segment and subsegment integration

### Health Check Extensions
- **gRPC Health Protocol** — Standard gRPC health checking
- **Kubernetes Probes** — Liveness, readiness, startup endpoints
- **Custom Business Checks** — Domain-specific health validation

## Design Principles

- **No external dependencies**: Core interfaces depend only on TypeScript
- **No business coupling**: Module knows nothing about reservations, tables, etc.
- **Clean Architecture**: Provider implementations are outside this module
- **SOLID**: Single responsibility per interface, open for extension
- **Strict TypeScript**: No `any` types, full type safety via generics
- **Testability**: Noop implementations for all abstractions
