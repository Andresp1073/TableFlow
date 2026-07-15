import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";

export type AnalysisType =
  | "latency"
  | "throughput"
  | "memory"
  | "cpu"
  | "io"
  | "network_latency";

export const ANALYSIS_TYPES: readonly AnalysisType[] = [
  "latency",
  "throughput",
  "memory",
  "cpu",
  "io",
  "network_latency",
];

export type AnalysisSeverity = "critical" | "high" | "medium" | "low" | "info";

export type BottleneckType =
  | "slow_operation"
  | "resource_contention"
  | "high_latency"
  | "queue_saturation"
  | "cache_inefficiency"
  | "long_running_task";

export const BOTTLENECK_TYPES: readonly BottleneckType[] = [
  "slow_operation",
  "resource_contention",
  "high_latency",
  "queue_saturation",
  "cache_inefficiency",
  "long_running_task",
];

export type OptimizationArea =
  | "caching"
  | "parallel_execution"
  | "batch_processing"
  | "connection_pooling"
  | "compression"
  | "lazy_loading"
  | "asynchronous_execution";

export const OPTIMIZATION_AREAS: readonly OptimizationArea[] = [
  "caching",
  "parallel_execution",
  "batch_processing",
  "connection_pooling",
  "compression",
  "lazy_loading",
  "asynchronous_execution",
];

export type OptimizationImpact = "critical" | "high" | "medium" | "low";

export type OptimizationEffort = "hours" | "days" | "weeks" | "months";

export type PerformanceEventType =
  | "performance.issue_detected"
  | "optimization.suggested"
  | "optimization.applied"
  | "performance.threshold_exceeded";

export interface PerformanceMetric {
  name: string;
  type: AnalysisType;
  value: number;
  unit: string;
  timestamp: Date;
  labels: Record<string, string>;
  source?: string;
}

export interface AnalysisThreshold {
  warning: number;
  critical: number;
}

export interface AnalysisResult {
  metric: PerformanceMetric;
  threshold: AnalysisThreshold;
  severity: AnalysisSeverity;
  message: string;
  details: string[];
}

export interface Bottleneck {
  id: string;
  type: BottleneckType;
  severity: AnalysisSeverity;
  resource: string;
  description: string;
  currentValue: number;
  threshold: number;
  impact: string;
  evidence: readonly string[];
  detectedAt: Date;
  affectedOperations: readonly string[];
  suggestedOptimizations: readonly OptimizationArea[];
}

export interface OptimizationRecommendation {
  id: string;
  area: OptimizationArea;
  severity: AnalysisSeverity;
  title: string;
  description: string;
  currentValue: number;
  expectedValue: number;
  expectedImpact: string;
  effort: OptimizationEffort;
  implementation: readonly string[];
  prerequisites: readonly string[];
  autoResolve: boolean;
  createdAt: Date;
  appliedAt?: Date;
  status: "pending" | "applied" | "dismissed";
}

export interface ResourceUsageSnapshot {
  cpuPercent: number;
  memoryMb: number;
  memoryPercent: number;
  ioReadBytes: number;
  ioWriteBytes: number;
  networkRxBytes: number;
  networkTxBytes: number;
  timestamp: Date;
  labels: Record<string, string>;
}

export interface ConcurrencyInfo {
  activeThreads: number;
  pendingTasks: number;
  queueDepth: number;
  poolUtilization: number;
  timestamp: Date;
}

export interface DependencyMetric {
  name: string;
  avgLatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  requestRate: number;
  timestamp: Date;
}

export interface PerformanceProfile {
  name: string;
  executionTime: {
    avgMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
    minMs: number;
    maxMs: number;
  };
  resourceUsage: ResourceUsageSnapshot;
  concurrency: ConcurrencyInfo;
  dependencies: readonly DependencyMetric[];
  historicalTrends: {
    throughputTrend: number;
    latencyTrend: number;
    errorRateTrend: number;
    observationCount: number;
    windowMs: number;
  };
  timestamp: Date;
  labels: Record<string, string>;
}

export interface PerformanceProfileConfig {
  name: string;
  executionTime?: {
    avgMs?: number;
    p50Ms?: number;
    p95Ms?: number;
    p99Ms?: number;
    minMs?: number;
    maxMs?: number;
  };
  resourceUsage?: Partial<ResourceUsageSnapshot>;
  concurrency?: Partial<ConcurrencyInfo>;
  dependencies?: DependencyMetric[];
  historicalTrends?: {
    throughputTrend?: number;
    latencyTrend?: number;
    errorRateTrend?: number;
    observationCount?: number;
    windowMs?: number;
  };
  labels?: Record<string, string>;
}

export interface AnalyzeOptions {
  thresholds?: Partial<Record<AnalysisType, AnalysisThreshold>>;
}

export interface OptimizeOptions {
  areas?: OptimizationArea[];
  minImpact?: OptimizationImpact;
  maxEffort?: OptimizationEffort;
}

export interface PerformanceProfileOptions {
  analyzer?: PerformanceAnalyzer;
  bottleneckDetector?: BottleneckDetector;
  optimizationEngine?: OptimizationEngine;
}

export interface PerformanceProfileResult {
  profile: PerformanceProfile;
  analysis: readonly AnalysisResult[];
  bottlenecks: readonly Bottleneck[];
  recommendations: readonly OptimizationRecommendation[];
}

export interface PerformanceAnalyzer {
  analyze(metrics: PerformanceMetric[], options?: AnalyzeOptions): Promise<AnalysisResult[]>;
  getDefaultThresholds(): Record<AnalysisType, AnalysisThreshold>;
}

export interface BottleneckDetector {
  detect(analysis: AnalysisResult[], options?: AnalyzeOptions): Bottleneck[];
  getDefaultThresholds(): Record<BottleneckType, number>;
}

export interface OptimizationEngine {
  suggest(bottlenecks: Bottleneck[], profile: PerformanceProfile, options?: OptimizeOptions): OptimizationRecommendation[];
  apply(recommendation: OptimizationRecommendation): OptimizationRecommendation;
  dismiss(recommendation: OptimizationRecommendation): OptimizationRecommendation;
}
