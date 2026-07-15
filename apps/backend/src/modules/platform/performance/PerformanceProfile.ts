import type {
  PerformanceProfile,
  PerformanceProfileConfig,
  ResourceUsageSnapshot,
  ConcurrencyInfo,
  DependencyMetric,
} from "./types.js";
import { PerformanceValidationError } from "./errors.js";

export class PerformanceProfileBuilder {
  private readonly config: PerformanceProfileConfig;

  constructor(config: PerformanceProfileConfig) {
    PerformanceProfileBuilder.validate(config);
    this.config = config;
  }

  private static validate(config: PerformanceProfileConfig): void {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push("Profile name is required");
    }

    if (errors.length > 0) {
      throw new PerformanceValidationError("Invalid performance profile configuration", errors);
    }
  }

  build(): PerformanceProfile {
    const now = new Date();
    return {
      name: this.config.name,
      executionTime: {
        avgMs: this.config.executionTime?.avgMs ?? 0,
        p50Ms: this.config.executionTime?.p50Ms ?? 0,
        p95Ms: this.config.executionTime?.p95Ms ?? 0,
        p99Ms: this.config.executionTime?.p99Ms ?? 0,
        minMs: this.config.executionTime?.minMs ?? 0,
        maxMs: this.config.executionTime?.maxMs ?? 0,
      },
      resourceUsage: this.buildResourceUsage(now),
      concurrency: this.buildConcurrency(now),
      dependencies: Object.freeze(this.config.dependencies ?? []),
      historicalTrends: {
        throughputTrend: this.config.historicalTrends?.throughputTrend ?? 0,
        latencyTrend: this.config.historicalTrends?.latencyTrend ?? 0,
        errorRateTrend: this.config.historicalTrends?.errorRateTrend ?? 0,
        observationCount: this.config.historicalTrends?.observationCount ?? 0,
        windowMs: this.config.historicalTrends?.windowMs ?? 300_000,
      },
      timestamp: now,
      labels: { ...(this.config.labels ?? {}) },
    };
  }

  private buildResourceUsage(timestamp: Date): ResourceUsageSnapshot {
    const ru = this.config.resourceUsage;
    return {
      cpuPercent: ru?.cpuPercent ?? 0,
      memoryMb: ru?.memoryMb ?? 0,
      memoryPercent: ru?.memoryPercent ?? 0,
      ioReadBytes: ru?.ioReadBytes ?? 0,
      ioWriteBytes: ru?.ioWriteBytes ?? 0,
      networkRxBytes: ru?.networkRxBytes ?? 0,
      networkTxBytes: ru?.networkTxBytes ?? 0,
      timestamp,
      labels: { ...(ru?.labels ?? {}) },
    };
  }

  private buildConcurrency(timestamp: Date): ConcurrencyInfo {
    const c = this.config.concurrency;
    return {
      activeThreads: c?.activeThreads ?? 0,
      pendingTasks: c?.pendingTasks ?? 0,
      queueDepth: c?.queueDepth ?? 0,
      poolUtilization: c?.poolUtilization ?? 0,
      timestamp,
    };
  }

  static createDefault(name: string): PerformanceProfileBuilder {
    return new PerformanceProfileBuilder({ name });
  }

  static fromProfile(profile: PerformanceProfile): PerformanceProfileBuilder {
    return new PerformanceProfileBuilder({
      name: profile.name,
      executionTime: { ...profile.executionTime },
      resourceUsage: { ...profile.resourceUsage, labels: { ...profile.resourceUsage.labels } },
      concurrency: { ...profile.concurrency },
      dependencies: profile.dependencies.map((d) => ({ ...d })),
      historicalTrends: { ...profile.historicalTrends },
      labels: { ...profile.labels },
    });
  }
}
