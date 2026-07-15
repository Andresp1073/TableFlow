import type {
  PerformanceMetric,
  AnalysisResult,
  AnalysisThreshold,
  AnalysisType,
  AnalysisSeverity,
  AnalyzeOptions,
  PerformanceAnalyzer,
} from "./types.js";
import { ANALYSIS_TYPES } from "./types.js";
import { AnalysisError, PerformanceValidationError } from "./errors.js";

const DEFAULT_THRESHOLDS: Record<AnalysisType, AnalysisThreshold> = {
  latency: { warning: 200, critical: 1000 },
  throughput: { warning: 100, critical: 50 },
  memory: { warning: 70, critical: 90 },
  cpu: { warning: 70, critical: 90 },
  io: { warning: 60, critical: 85 },
  network_latency: { warning: 100, critical: 500 },
};

export class PerformanceAnalyzerImpl implements PerformanceAnalyzer {
  private readonly thresholds: Record<AnalysisType, AnalysisThreshold>;

  constructor(customThresholds?: Partial<Record<AnalysisType, AnalysisThreshold>>) {
    this.thresholds = {
      latency: customThresholds?.latency ?? { ...DEFAULT_THRESHOLDS.latency },
      throughput: customThresholds?.throughput ?? { ...DEFAULT_THRESHOLDS.throughput },
      memory: customThresholds?.memory ?? { ...DEFAULT_THRESHOLDS.memory },
      cpu: customThresholds?.cpu ?? { ...DEFAULT_THRESHOLDS.cpu },
      io: customThresholds?.io ?? { ...DEFAULT_THRESHOLDS.io },
      network_latency: customThresholds?.network_latency ?? { ...DEFAULT_THRESHOLDS.network_latency },
    };
  }

  getDefaultThresholds(): Record<AnalysisType, AnalysisThreshold> {
    return {
      latency: { ...DEFAULT_THRESHOLDS.latency },
      throughput: { ...DEFAULT_THRESHOLDS.throughput },
      memory: { ...DEFAULT_THRESHOLDS.memory },
      cpu: { ...DEFAULT_THRESHOLDS.cpu },
      io: { ...DEFAULT_THRESHOLDS.io },
      network_latency: { ...DEFAULT_THRESHOLDS.network_latency },
    };
  }

  async analyze(metrics: PerformanceMetric[], options?: AnalyzeOptions): Promise<AnalysisResult[]> {
    const errors: string[] = [];
    if (!metrics || metrics.length === 0) {
      errors.push("At least one metric is required for analysis");
    }
    for (const metric of metrics) {
      if (!ANALYSIS_TYPES.includes(metric.type)) {
        errors.push(`Invalid analysis type: ${metric.type}`);
      }
    }
    if (errors.length > 0) {
      throw new PerformanceValidationError("Invalid metric data", errors);
    }

    const mergedThresholds = options?.thresholds
      ? { ...this.thresholds, ...options.thresholds }
      : this.thresholds;

    return metrics.map((metric) => this.evaluateMetric(metric, mergedThresholds));
  }

  private evaluateMetric(
    metric: PerformanceMetric,
    thresholds: Record<AnalysisType, AnalysisThreshold>,
  ): AnalysisResult {
    const threshold = thresholds[metric.type];

    if (!threshold) {
      throw new AnalysisError(metric.type, `No threshold configured for analysis type: ${metric.type}`);
    }

    const severity = this.computeSeverity(metric.value, metric.type, threshold);
    const message = this.buildMessage(metric, severity, threshold);
    const details = this.buildDetails(metric, threshold);

    return { metric, threshold, severity, message, details };
  }

  private computeSeverity(
    value: number,
    type: AnalysisType,
    threshold: AnalysisThreshold,
  ): AnalysisSeverity {
    if (type === "throughput") {
      if (value < threshold.critical) {
        return "critical";
      }
      if (value < threshold.warning) {
        return "high";
      }
      return "info";
    }
    if (value >= threshold.critical) {
      return "critical";
    }
    if (value >= threshold.warning) {
      return "high";
    }
    if (value > threshold.warning * 0.5) {
      return "medium";
    }
    return "info";
  }

  private buildMessage(
    metric: PerformanceMetric,
    severity: AnalysisSeverity,
    threshold: AnalysisThreshold,
  ): string {
    const prefix = severity === "critical" ? "Critical" : severity === "high" ? "High" : "Moderate";
    const isThroughput = metric.type === "throughput";
    const direction = isThroughput ? "below" : "above";
    const warningVal = isThroughput ? threshold.critical : threshold.warning;
    const criticalVal = isThroughput ? threshold.warning : threshold.critical;
    return `${prefix} ${metric.type}: ${metric.name} is ${direction} threshold (${metric.value}${metric.unit}, warning: ${warningVal}${metric.unit}, critical: ${criticalVal}${metric.unit})`;
  }

  private buildDetails(metric: PerformanceMetric, threshold: AnalysisThreshold): string[] {
    const details: string[] = [
      `Metric: ${metric.name}`,
      `Type: ${metric.type}`,
      `Current value: ${metric.value}${metric.unit}`,
      `Warning threshold: ${threshold.warning}${metric.unit}`,
      `Critical threshold: ${threshold.critical}${metric.unit}`,
    ];
    if (metric.source) {
      details.push(`Source: ${metric.source}`);
    }
    return details;
  }
}
