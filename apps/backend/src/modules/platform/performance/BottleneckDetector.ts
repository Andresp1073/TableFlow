import type {
  AnalysisResult,
  Bottleneck,
  BottleneckType,
  AnalysisSeverity,
  OptimizationArea,
  AnalyzeOptions,
  BottleneckDetector,
} from "./types.js";
import { BOTTLENECK_TYPES } from "./types.js";
import { generateEventId } from "../event-bus/EventMetadata.js";
import { BottleneckDetectionError, PerformanceValidationError } from "./errors.js";

const DEFAULT_BOTTLENECK_THRESHOLDS: Record<BottleneckType, number> = {
  slow_operation: 1000,
  resource_contention: 80,
  high_latency: 500,
  queue_saturation: 100,
  cache_inefficiency: 30,
  long_running_task: 30000,
};

const TYPE_OPTIMIZATION_MAP: Record<BottleneckType, readonly OptimizationArea[]> = {
  slow_operation: ["parallel_execution", "asynchronous_execution", "caching"],
  resource_contention: ["connection_pooling", "batch_processing", "parallel_execution"],
  high_latency: ["caching", "compression", "lazy_loading"],
  queue_saturation: ["batch_processing", "parallel_execution", "asynchronous_execution"],
  cache_inefficiency: ["caching", "lazy_loading"],
  long_running_task: ["asynchronous_execution", "batch_processing", "parallel_execution"],
};

export class BottleneckDetectorImpl implements BottleneckDetector {
  private readonly thresholds: Record<BottleneckType, number>;

  constructor(customThresholds?: Partial<Record<BottleneckType, number>>) {
    this.thresholds = {
      slow_operation: customThresholds?.slow_operation ?? DEFAULT_BOTTLENECK_THRESHOLDS.slow_operation,
      resource_contention: customThresholds?.resource_contention ?? DEFAULT_BOTTLENECK_THRESHOLDS.resource_contention,
      high_latency: customThresholds?.high_latency ?? DEFAULT_BOTTLENECK_THRESHOLDS.high_latency,
      queue_saturation: customThresholds?.queue_saturation ?? DEFAULT_BOTTLENECK_THRESHOLDS.queue_saturation,
      cache_inefficiency: customThresholds?.cache_inefficiency ?? DEFAULT_BOTTLENECK_THRESHOLDS.cache_inefficiency,
      long_running_task: customThresholds?.long_running_task ?? DEFAULT_BOTTLENECK_THRESHOLDS.long_running_task,
    };
  }

  getDefaultThresholds(): Record<BottleneckType, number> {
    return { ...DEFAULT_BOTTLENECK_THRESHOLDS };
  }

  detect(analysis: AnalysisResult[], options?: AnalyzeOptions): Bottleneck[] {
    const errors: string[] = [];
    if (!analysis || analysis.length === 0) {
      errors.push("At least one analysis result is required");
    }
    if (errors.length > 0) {
      throw new PerformanceValidationError("Invalid analysis data", errors);
    }

    const bottlenecks: Bottleneck[] = [];
    const thresholds = options?.thresholds
      ? this.mergeThresholds(options.thresholds)
      : this.thresholds;

    for (const result of analysis) {
      const detected = this.detectFromAnalysis(result, thresholds);
      if (detected) {
        bottlenecks.push(detected);
      }
    }

    return bottlenecks;
  }

  private mergeThresholds(
    custom: Record<string, AnalysisSeverity | number>,
  ): Record<BottleneckType, number> {
    const merged = { ...this.thresholds };
    for (const [key, value] of Object.entries(custom)) {
      if (key in merged && typeof value === "number") {
        merged[key as BottleneckType] = value;
      }
    }
    return merged;
  }

  private detectFromAnalysis(
    result: AnalysisResult,
    thresholds: Record<BottleneckType, number>,
  ): Bottleneck | null {
    const type = this.deriveBottleneckType(result.metric.type);
    if (!type) {
      return null;
    }

    const threshold = thresholds[type];
    const isInverted = result.metric.type === "throughput";
    const exceedsThreshold = isInverted
      ? result.metric.value < threshold
      : result.metric.value > threshold;
    if (!exceedsThreshold && result.severity !== "critical" && result.severity !== "high") {
      return null;
    }

    return {
      id: generateEventId(),
      type,
      severity: result.severity,
      resource: result.metric.name,
      description: this.buildDescription(type, result),
      currentValue: result.metric.value,
      threshold,
      impact: this.buildImpact(type, result),
      evidence: result.details,
      detectedAt: new Date(),
      affectedOperations: this.buildAffectedOperations(result),
      suggestedOptimizations: TYPE_OPTIMIZATION_MAP[type],
    };
  }

  private deriveBottleneckType(analysisType: string): BottleneckType | null {
    const map: Record<string, BottleneckType> = {
      latency: "high_latency",
      memory: "resource_contention",
      cpu: "resource_contention",
      io: "resource_contention",
      throughput: "queue_saturation",
      network_latency: "high_latency",
    };
    return map[analysisType] ?? null;
  }

  private buildDescription(type: BottleneckType, result: AnalysisResult): string {
    const descriptions: Record<BottleneckType, string> = {
      slow_operation: `Operation ${result.metric.name} is executing slowly (${result.metric.value}${result.metric.unit})`,
      resource_contention: `Resource ${result.metric.name} is experiencing contention (${result.metric.value}${result.metric.unit})`,
      high_latency: `High latency detected on ${result.metric.name} (${result.metric.value}${result.metric.unit})`,
      queue_saturation: `Queue saturation detected for ${result.metric.name} (${result.metric.value}${result.metric.unit})`,
      cache_inefficiency: `Cache inefficiency detected for ${result.metric.name} (${result.metric.value}${result.metric.unit})`,
      long_running_task: `Long running task detected: ${result.metric.name} (${result.metric.value}${result.metric.unit})`,
    };
    return descriptions[type] ?? `Bottleneck detected on ${result.metric.name}`;
  }

  private buildImpact(type: BottleneckType, result: AnalysisResult): string {
    const impacts: Record<BottleneckType, string> = {
      slow_operation: "Increases response time and reduces user experience",
      resource_contention: "Degrades overall system throughput and stability",
      high_latency: "Exceeds SLO targets and degrades user experience",
      queue_saturation: "Causes request queuing and potential timeouts",
      cache_inefficiency: "Increases backend load and reduces response speed",
      long_running_task: "Blocks resources and delays other operations",
    };
    return impacts[type] ?? "Degrades system performance";
  }

  private buildAffectedOperations(result: AnalysisResult): string[] {
    return [result.metric.name];
  }
}
