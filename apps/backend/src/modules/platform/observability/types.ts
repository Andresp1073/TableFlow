export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  traceId?: string;
  requestId?: string;
  correlationId?: string;
  userId?: string;
  restaurantId?: string;
  operation?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

export type LogContext = Omit<LogEntry, "timestamp" | "level" | "message">;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  fatal(message: string, context?: LogContext): void;
  log(level: LogLevel, message: string, context?: LogContext): void;
  child(context: Partial<LogContext>): Logger;
}

export type MetricLabelNames = string[];

export interface MetricLabels {
  [key: string]: string;
}

export interface Counter {
  inc(value?: number, labels?: MetricLabels): void;
  reset(): void;
  collect(): number;
}

export interface Gauge {
  set(value: number, labels?: MetricLabels): void;
  inc(value?: number, labels?: MetricLabels): void;
  dec(value?: number, labels?: MetricLabels): void;
  reset(): void;
  collect(): number;
}

export interface HistogramBucket {
  upperBound: number;
  cumulativeCount: number;
}

export interface HistogramData {
  count: number;
  sum: number;
  buckets: HistogramBucket[];
}

export interface Histogram {
  observe(value: number, labels?: MetricLabels): void;
  reset(): void;
  collect(): HistogramData;
}

export interface Timer {
  start(): () => number;
  measure<T>(fn: () => Promise<T>): Promise<T>;
  observe(duration: number, labels?: MetricLabels): void;
}

export interface MetricsSnapshot {
  counters: Map<string, number>;
  gauges: Map<string, number>;
  histograms: Map<string, HistogramData>;
  timers: Map<string, number[]>;
}

export interface MetricsCollector {
  createCounter(name: string, help: string, labelNames?: MetricLabelNames): Counter;
  createGauge(name: string, help: string, labelNames?: MetricLabelNames): Gauge;
  createHistogram(name: string, help: string, labelNames?: MetricLabelNames): Histogram;
  createTimer(name: string, help: string, labelNames?: MetricLabelNames): Timer;
  getMetrics(): MetricsSnapshot;
  clear(): void;
}

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  isRemote?: boolean;
  traceFlags?: number;
  traceState?: string;
}

export enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

export interface SpanStatus {
  code: SpanStatusCode;
  message?: string;
}

export interface StartSpanOptions {
  parentContext?: SpanContext;
  attributes?: Record<string, unknown>;
  links?: Array<{ context: SpanContext; attributes?: Record<string, unknown> }>;
  startTime?: Date;
}

export interface Span {
  readonly spanContext: SpanContext;
  setAttribute(key: string, value: unknown): void;
  setAttributes(attributes: Record<string, unknown>): void;
  addEvent(name: string, attributes?: Record<string, unknown>): void;
  setStatus(status: SpanStatus): void;
  recordError(error: Error): void;
  end(endTime?: Date): void;
  isRecording(): boolean;
}

export interface Tracer {
  startSpan(name: string, options?: StartSpanOptions): Span;
  startActiveSpan<F extends (...args: unknown[]) => unknown>(
    name: string,
    fn: (span: Span) => ReturnType<F>,
    options?: StartSpanOptions,
  ): ReturnType<F>;
  withSpan<F extends (...args: unknown[]) => unknown>(
    parent: SpanContext,
    name: string,
    fn: (span: Span) => ReturnType<F>,
  ): ReturnType<F>;
  inject(context: SpanContext, carrier: Record<string, unknown>): void;
  extract(carrier: Record<string, unknown>): SpanContext | null;
}

export type HealthStatusType = "healthy" | "degraded" | "unhealthy";

export interface HealthCheckResult {
  status: HealthStatusType;
  component: string;
  message?: string;
  timestamp: string;
  duration: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface HealthCheck {
  readonly name: string;
  check(): Promise<HealthCheckResult>;
}

export interface OverallHealthStatus {
  status: HealthStatusType;
  checks: HealthCheckResult[];
  timestamp: string;
  totalDuration: number;
}

export interface HealthAggregator {
  register(check: HealthCheck): void;
  unregister(name: string): void;
  checkAll(): Promise<HealthCheckResult[]>;
  checkAllGrouped(): Promise<Record<string, HealthCheckResult[]>>;
  getStatus(): Promise<OverallHealthStatus>;
}
