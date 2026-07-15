import type { AlertPolicyConfig, AlertType, AlertSeverity, AlertCondition, AlertResult, AlertStatus } from "./types.js";
import { ALERT_TYPES } from "./types.js";
import { MonitoringValidationError } from "./errors.js";
import { generateEventId } from "../event-bus/EventMetadata.js";

export class AlertPolicy {
  readonly name: string;
  readonly type: AlertType;
  readonly severity: AlertSeverity;
  readonly metric: string;
  readonly condition: AlertCondition;
  readonly threshold: number;
  readonly duration: string;
  readonly evaluationIntervalMs: number;
  readonly description: string;
  readonly labels: Readonly<Record<string, string>>;
  readonly annotations: Readonly<Record<string, string>>;
  readonly notificationChannels: readonly string[];
  readonly cooldownMs: number;
  readonly enabled: boolean;

  private lastFiredAt?: Date;

  constructor(config: AlertPolicyConfig) {
    AlertPolicy.validate(config);

    this.name = config.name;
    this.type = config.type;
    this.severity = config.severity;
    this.metric = config.metric;
    this.condition = config.condition;
    this.threshold = config.threshold;
    this.duration = config.duration;
    this.evaluationIntervalMs = config.evaluationIntervalMs;
    this.description = config.description ?? "";
    this.labels = Object.freeze({ ...config.labels });
    this.annotations = Object.freeze({ ...config.annotations });
    this.notificationChannels = Object.freeze([...(config.notificationChannels ?? [])]);
    this.cooldownMs = config.cooldownMs;
    this.enabled = config.enabled;
  }

  private static validate(config: AlertPolicyConfig): void {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push("Alert policy name is required");
    }

    if (!ALERT_TYPES.includes(config.type)) {
      errors.push(`Invalid alert type: ${config.type}`);
    }

    if (!config.metric || config.metric.trim().length === 0) {
      errors.push("Metric name is required");
    }

    if (errors.length > 0) {
      throw new MonitoringValidationError("Invalid alert policy", errors);
    }
  }

  evaluate(value: number): AlertResult | null {
    if (!this.enabled) {
      return null;
    }

    const isFiring = this.evaluateCondition(value);

    if (!isFiring) {
      return null;
    }

    if (this.lastFiredAt && (Date.now() - this.lastFiredAt.getTime()) < this.cooldownMs) {
      return null;
    }

    this.lastFiredAt = new Date();

    return {
      id: generateEventId(),
      policyName: this.name,
      type: this.type,
      severity: this.severity,
      status: "firing",
      metric: this.metric,
      value,
      threshold: this.threshold,
      condition: this.condition,
      triggeredAt: new Date(),
      durationMs: 0,
      labels: { ...this.labels },
      annotations: { ...this.annotations },
    };
  }

  private evaluateCondition(value: number): boolean {
    switch (this.condition) {
      case "above":
        return value > this.threshold;
      case "below":
        return value < this.threshold;
      case "equals":
        return value === this.threshold;
      case "changed":
        return value !== this.threshold;
    }
  }

  isInCooldown(): boolean {
    if (!this.lastFiredAt) {
      return false;
    }
    return (Date.now() - this.lastFiredAt.getTime()) < this.cooldownMs;
  }

  resetCooldown(): void {
    this.lastFiredAt = undefined;
  }

  toConfig(): AlertPolicyConfig {
    return {
      name: this.name,
      type: this.type,
      severity: this.severity,
      metric: this.metric,
      condition: this.condition,
      threshold: this.threshold,
      duration: this.duration,
      evaluationIntervalMs: this.evaluationIntervalMs,
      description: this.description,
      labels: { ...this.labels },
      annotations: { ...this.annotations },
      notificationChannels: [...this.notificationChannels],
      cooldownMs: this.cooldownMs,
      enabled: this.enabled,
    };
  }

  static createThreshold(
    name: string, metric: string, threshold: number, severity: AlertSeverity,
    condition: AlertCondition = "above",
  ): AlertPolicy {
    return new AlertPolicy({
      name, type: "threshold", severity, metric, condition, threshold,
      duration: "5m", evaluationIntervalMs: 60_000, cooldownMs: 300_000, enabled: true,
      labels: { alert_type: "threshold" }, annotations: {},
    });
  }

  static createAvailability(name: string, metric: string, threshold: number, severity: AlertSeverity): AlertPolicy {
    return new AlertPolicy({
      name, type: "availability", severity, metric,
      condition: "below", threshold,
      duration: "5m", evaluationIntervalMs: 60_000, cooldownMs: 300_000, enabled: true,
      labels: { alert_type: "availability" }, annotations: {},
    });
  }

  static createLatency(name: string, metric: string, thresholdMs: number, severity: AlertSeverity): AlertPolicy {
    return new AlertPolicy({
      name, type: "latency", severity, metric,
      condition: "above", threshold: thresholdMs,
      duration: "5m", evaluationIntervalMs: 60_000, cooldownMs: 300_000, enabled: true,
      labels: { alert_type: "latency" }, annotations: {},
    });
  }

  static createErrorRate(name: string, metric: string, threshold: number, severity: AlertSeverity): AlertPolicy {
    return new AlertPolicy({
      name, type: "error_rate", severity, metric,
      condition: "above", threshold,
      duration: "5m", evaluationIntervalMs: 60_000, cooldownMs: 300_000, enabled: true,
      labels: { alert_type: "error_rate" }, annotations: {},
    });
  }
}
