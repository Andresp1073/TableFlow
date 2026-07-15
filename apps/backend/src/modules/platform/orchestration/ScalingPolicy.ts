import type {
  ScalingPolicyConfig,
  ScalingStrategyType,
  ScalingMetric,
  ScalingSchedule,
  HorizontalScalingConfig,
  VerticalScalingConfig,
  ScalingResult,
} from "./types.js";
import { SCALING_STRATEGY_TYPES } from "./types.js";
import { OrchestrationValidationError } from "./errors.js";

export class ScalingPolicy {
  readonly strategy: ScalingStrategyType;
  readonly minReplicas: number;
  readonly maxReplicas: number;
  readonly targetReplicas?: number;
  readonly metrics: readonly ScalingMetric[];
  readonly schedule: readonly ScalingSchedule[];
  readonly cooldownPeriodMs: number;
  readonly scaleDownStabilizationMs: number;

  constructor(config: ScalingPolicyConfig) {
    ScalingPolicy.validate(config);

    this.strategy = config.strategy;
    this.minReplicas = config.minReplicas;
    this.maxReplicas = config.maxReplicas;
    this.targetReplicas = config.targetReplicas;
    this.metrics = Object.freeze([...(config.metrics ?? [])]);
    this.schedule = Object.freeze([...(config.schedule ?? [])]);
    this.cooldownPeriodMs = config.cooldownPeriodMs;
    this.scaleDownStabilizationMs = config.scaleDownStabilizationMs;
  }

  private static validate(config: ScalingPolicyConfig): void {
    const errors: string[] = [];

    if (!SCALING_STRATEGY_TYPES.includes(config.strategy)) {
      errors.push(`Invalid scaling strategy: ${config.strategy}`);
    }

    if (config.minReplicas < 0) {
      errors.push("Min replicas must be non-negative");
    }

    if (config.maxReplicas < config.minReplicas) {
      errors.push("Max replicas must be >= min replicas");
    }

    if (config.targetReplicas !== undefined && config.targetReplicas < config.minReplicas) {
      errors.push("Target replicas must be >= min replicas");
    }

    if (config.targetReplicas !== undefined && config.targetReplicas > config.maxReplicas) {
      errors.push("Target replicas must be <= max replicas");
    }

    if (errors.length > 0) {
      throw new OrchestrationValidationError("Invalid scaling policy", errors);
    }
  }

  calculateTargetReplicas(currentLoad?: number): number {
    if (this.targetReplicas !== undefined) {
      return this.targetReplicas;
    }

    if (this.metrics.length === 0) {
      return this.minReplicas;
    }

    const cpuMetric = this.metrics.find((m) => m.type === "cpu");
    if (cpuMetric && currentLoad !== undefined) {
      const targetUtilization = cpuMetric.targetAverageUtilization ?? 80;
      const desiredReplicas = Math.ceil((currentLoad / targetUtilization) * this.minReplicas);
      return Math.max(this.minReplicas, Math.min(this.maxReplicas, desiredReplicas));
    }

    return this.minReplicas;
  }

  toHorizontalConfig(): HorizontalScalingConfig {
    const cpuMetric = this.metrics.find((m) => m.type === "cpu");
    const memoryMetric = this.metrics.find((m) => m.type === "memory");

    return {
      minReplicas: this.minReplicas,
      maxReplicas: this.maxReplicas,
      targetCpuUtilization: cpuMetric?.targetAverageUtilization,
      targetMemoryUtilization: memoryMetric?.targetAverageUtilization,
      customMetrics: this.metrics.filter((m) => m.type === "custom" || m.type === "requests_per_second"),
    };
  }

  toVerticalConfig(): VerticalScalingConfig {
    return {
      minCpu: "50m",
      maxCpu: "2",
      minMemory: "64Mi",
      maxMemory: "4Gi",
      updateMode: "auto",
    };
  }

  static createAutoScaling(min: number, max: number, targetCpuUtilization: number): ScalingPolicy {
    return new ScalingPolicy({
      strategy: "auto",
      minReplicas: min,
      maxReplicas: max,
      metrics: [{ type: "cpu", targetAverageUtilization: targetCpuUtilization }],
      cooldownPeriodMs: 300_000,
      scaleDownStabilizationMs: 300_000,
    });
  }

  static createScheduled(schedule: ScalingSchedule[]): ScalingPolicy {
    return new ScalingPolicy({
      strategy: "scheduled",
      minReplicas: 1,
      maxReplicas: 10,
      schedule,
      cooldownPeriodMs: 60_000,
      scaleDownStabilizationMs: 60_000,
    });
  }

  static createFixed(replicas: number): ScalingPolicy {
    return new ScalingPolicy({
      strategy: "horizontal",
      minReplicas: replicas,
      maxReplicas: replicas,
      targetReplicas: replicas,
      cooldownPeriodMs: 0,
      scaleDownStabilizationMs: 0,
    });
  }
}
