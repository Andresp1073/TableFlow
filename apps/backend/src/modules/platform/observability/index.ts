export { LogLevel, SpanStatusCode } from "./types.js";
export type {
  LogEntry,
  LogContext,
  Logger,
  Counter,
  Gauge,
  Histogram,
  HistogramData,
  HistogramBucket,
  Timer,
  MetricsSnapshot,
  MetricsCollector,
  SpanContext,
  SpanStatus,
  StartSpanOptions,
  Span as SpanInterface,
  Tracer,
  HealthCheckResult,
  HealthStatusType,
  HealthCheck,
  OverallHealthStatus,
  HealthAggregator as HealthAggregatorInterface,
  MetricLabels,
  MetricLabelNames,
} from "./types.js";

export { BaseLogger, ConsoleLogger, NoopLogger } from "./logger/index.js";
export { CounterMetric, GaugeMetric, HistogramMetric, TimerMetric, NoopMetricsCollector } from "./metrics/index.js";
export { Span, DefaultTracer, NoopTracer, createSpanContext, isSpanContextValid } from "./tracing/index.js";
export {
  BaseHealthCheck,
  HealthAggregator,
  aggregateHealthStatus,
  healthy,
  degraded,
  unhealthy,
  ApplicationHealthCheck,
  DatabaseHealthCheck,
  CacheHealthCheck,
  QueueHealthCheck,
  ExternalServiceHealthCheck,
} from "./health/index.js";
