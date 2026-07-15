import type {
  ServiceLevelObjectiveConfig,
  ServiceLevelIndicatorConfig,
  SloResult,
  SloCompliance,
  ErrorBudgetResult,
} from "./types.js";
import { ServiceLevelIndicator } from "./ServiceLevelIndicator.js";
import { MonitoringValidationError } from "./errors.js";
import { MonitoringManager } from "./MonitoringManager.js";

export class ServiceLevelObjective {
  readonly name: string;
  readonly description: string;
  readonly sli: ServiceLevelIndicator;
  readonly target: number;
  readonly warningThreshold: number;
  readonly windowMs: number;
  readonly calendarAligned: boolean;

  constructor(config: ServiceLevelObjectiveConfig) {
    ServiceLevelObjective.validate(config);

    this.name = config.name;
    this.description = config.description ?? "";
    this.sli = new ServiceLevelIndicator(config.sli);
    this.target = config.target;
    this.warningThreshold = config.warningThreshold;
    this.windowMs = config.windowMs;
    this.calendarAligned = config.calendarAligned;
  }

  private static validate(config: ServiceLevelObjectiveConfig): void {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push("SLO name is required");
    }

    if (config.target <= 0 || config.target > 100) {
      errors.push("SLO target must be between 1 and 100");
    }

    if (config.warningThreshold >= config.target) {
      errors.push("Warning threshold must be below the SLO target");
    }

    if (errors.length > 0) {
      throw new MonitoringValidationError("Invalid SLO configuration", errors);
    }
  }

  evaluate(sliValue: number): SloResult {
    const sliResult = this.sli.record(sliValue);
    const compliance = this.determineCompliance(sliValue);

    const errorBudgetResult: ErrorBudgetResult = {
      sloName: this.name,
      totalBudget: 100 - this.target,
      remaining: Math.max(0, sliValue - this.target),
      consumed: Math.max(0, this.target - sliValue),
      consumptionRate: 0,
      status: sliValue >= this.target ? "healthy" : sliValue >= this.warningThreshold ? "warning" : "exhausted",
      lastUpdated: new Date(),
    };

    return {
      name: this.name,
      sli: sliResult,
      target: this.target,
      compliance,
      errorBudget: errorBudgetResult,
      windowMs: this.windowMs,
      timestamp: new Date(),
    };
  }

  private determineCompliance(value: number): SloCompliance {
    if (value >= this.target) {
      return "achieved";
    }
    if (value >= this.warningThreshold) {
      return "warning";
    }
    return "breached";
  }

  static createAvailability(
    name: string, numeratorQuery: string, denominatorQuery: string,
    target: number = 99.9, warningThreshold: number = 99.5,
  ): ServiceLevelObjective {
    const sli = ServiceLevelIndicator.createAvailability(`${name}-sli`, numeratorQuery, denominatorQuery, target);
    return new ServiceLevelObjective({
      name, description: `Availability SLO: ${target}%`,
      sli: {
        name: sli.name, type: sli.type, metric: sli.metric,
        numeratorQuery: sli.numeratorQuery, denominatorQuery: sli.denominatorQuery,
        evaluationWindowMs: sli.evaluationWindowMs, targetValue: sli.targetValue,
      },
      target, warningThreshold,
      windowMs: 2_592_000_000, calendarAligned: true, errorBudgetInitial: 100 - target,
    });
  }

  static createLatency(
    name: string, query: string,
    targetMs: number = 200, sloTarget: number = 95, warningThreshold: number = 90,
  ): ServiceLevelObjective {
    const sli = ServiceLevelIndicator.createLatency(`${name}-sli`, query, targetMs);
    return new ServiceLevelObjective({
      name, description: `Latency P99 SLO: ${targetMs}ms`,
      sli: {
        name: sli.name, type: sli.type, metric: sli.metric,
        numeratorQuery: sli.numeratorQuery, denominatorQuery: sli.denominatorQuery,
        evaluationWindowMs: sli.evaluationWindowMs, targetValue: sli.targetValue,
      },
      target: sloTarget, warningThreshold,
      windowMs: 2_592_000_000, calendarAligned: true, errorBudgetInitial: 100 - sloTarget,
    });
  }
}
