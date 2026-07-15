import type { ServiceLevelIndicatorConfig, SliType, SliResult } from "./types.js";
import { SLI_TYPES } from "./types.js";
import { MonitoringValidationError } from "./errors.js";

export class ServiceLevelIndicator {
  readonly name: string;
  readonly type: SliType;
  readonly description: string;
  readonly metric: string;
  readonly filter?: string;
  readonly numeratorQuery: string;
  readonly denominatorQuery: string;
  readonly evaluationWindowMs: number;
  readonly targetValue: number;

  private lastValue: number = 0;

  constructor(config: ServiceLevelIndicatorConfig) {
    ServiceLevelIndicator.validate(config);

    this.name = config.name;
    this.type = config.type;
    this.description = config.description ?? "";
    this.metric = config.metric;
    this.filter = config.filter;
    this.numeratorQuery = config.numeratorQuery;
    this.denominatorQuery = config.denominatorQuery;
    this.evaluationWindowMs = config.evaluationWindowMs;
    this.targetValue = config.targetValue;
  }

  private static validate(config: ServiceLevelIndicatorConfig): void {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push("SLI name is required");
    }

    if (!SLI_TYPES.includes(config.type)) {
      errors.push(`Invalid SLI type: ${config.type}`);
    }

    if (!config.numeratorQuery) {
      errors.push("Numerator query is required");
    }

    if (!config.denominatorQuery) {
      errors.push("Denominator query is required");
    }

    if (errors.length > 0) {
      throw new MonitoringValidationError("Invalid SLI configuration", errors);
    }
  }

  record(value: number): SliResult {
    this.lastValue = value;

    return {
      name: this.name,
      type: this.type,
      currentValue: value,
      targetValue: this.targetValue,
      windowMs: this.evaluationWindowMs,
      timestamp: new Date(),
    };
  }

  getCurrentValue(): number {
    return this.lastValue;
  }

  meetsTarget(): boolean {
    switch (this.type) {
      case "availability":
      case "success_rate":
        return this.lastValue >= this.targetValue;
      case "latency":
      case "recovery_time":
        return this.lastValue <= this.targetValue;
      case "error_rate":
        return this.lastValue <= this.targetValue;
    }
  }

  static createAvailability(name: string, numeratorQuery: string, denominatorQuery: string, target: number): ServiceLevelIndicator {
    return new ServiceLevelIndicator({
      name, type: "availability", metric: "availability",
      numeratorQuery, denominatorQuery,
      evaluationWindowMs: 300_000, targetValue: target,
    });
  }

  static createLatency(name: string, query: string, targetMs: number): ServiceLevelIndicator {
    return new ServiceLevelIndicator({
      name, type: "latency", metric: "latency_p99",
      numeratorQuery: query, denominatorQuery: "1",
      evaluationWindowMs: 300_000, targetValue: targetMs,
    });
  }

  static createErrorRate(name: string, numeratorQuery: string, denominatorQuery: string, target: number): ServiceLevelIndicator {
    return new ServiceLevelIndicator({
      name, type: "error_rate", metric: "error_rate",
      numeratorQuery, denominatorQuery,
      evaluationWindowMs: 300_000, targetValue: target,
    });
  }
}
