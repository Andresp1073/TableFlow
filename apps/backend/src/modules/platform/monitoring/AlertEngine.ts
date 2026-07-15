import type {
  AlertPolicyConfig,
  AlertResult,
  AlertType,
  AlertStatus,
  AlertSeverity,
} from "./types.js";
import { AlertPolicy } from "./AlertPolicy.js";
import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";
import { publishMonitoringEvent } from "./events.js";
import { MonitoringNotFoundError } from "./errors.js";

export class AlertEngine {
  private readonly policies: Map<string, AlertPolicy> = new Map();
  private readonly activeAlerts: Map<string, AlertResult> = new Map();
  private readonly alertHistory: AlertResult[] = [];
  private readonly logger?: Logger;
  private readonly eventPublisher?: EventPublisher;

  constructor(options?: { logger?: Logger; eventPublisher?: EventPublisher }) {
    this.logger = options?.logger;
    this.eventPublisher = options?.eventPublisher;
  }

  registerPolicy(config: AlertPolicyConfig): AlertPolicy {
    const policy = new AlertPolicy(config);
    this.policies.set(policy.name, policy);
    return policy;
  }

  registerPolicyInstance(policy: AlertPolicy): void {
    this.policies.set(policy.name, policy);
  }

  getPolicy(name: string): AlertPolicy | undefined {
    return this.policies.get(name);
  }

  removePolicy(name: string): void {
    this.policies.delete(name);
  }

  listPolicies(): AlertPolicy[] {
    return Array.from(this.policies.values());
  }

  evaluate(metric: string, value: number): AlertResult[] {
    const results: AlertResult[] = [];

    for (const policy of this.policies.values()) {
      if (policy.metric !== metric) {
        continue;
      }

      const result = policy.evaluate(value);
      if (result) {
        results.push(result);
        this.activeAlerts.set(result.id, result);
        this.alertHistory.push(result);

        publishMonitoringEvent(
          this.eventPublisher,
          this.logger,
          "alert.triggered",
          policy.name,
          { metric, value, threshold: policy.threshold, severity: policy.severity, alertId: result.id },
        );
      }
    }

    return results;
  }

  evaluateAll(metrics: Record<string, number>): AlertResult[] {
    const results: AlertResult[] = [];

    for (const [metric, value] of Object.entries(metrics)) {
      results.push(...this.evaluate(metric, value));
    }

    return results;
  }

  resolveAlert(alertId: string): AlertResult | undefined {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return undefined;
    }

    const resolved: AlertResult = {
      ...alert,
      status: "resolved",
      resolvedAt: new Date(),
      durationMs: Date.now() - alert.triggeredAt.getTime(),
    };

    this.activeAlerts.set(alertId, resolved);

    publishMonitoringEvent(
      this.eventPublisher,
      this.logger,
      "alert.resolved",
      alert.policyName,
      { alertId, durationMs: resolved.durationMs },
    );

    return resolved;
  }

  acknowledgeAlert(alertId: string, actor: string): AlertResult | undefined {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return undefined;
    }

    const acknowledged: AlertResult = {
      ...alert,
      status: "acknowledged",
      acknowledgedBy: actor,
      acknowledgedAt: new Date(),
    };

    this.activeAlerts.set(alertId, acknowledged);

    publishMonitoringEvent(
      this.eventPublisher,
      this.logger,
      "alert.acknowledged",
      alert.policyName,
      { alertId, actor },
    );

    return acknowledged;
  }

  getActiveAlert(alertId: string): AlertResult | undefined {
    return this.activeAlerts.get(alertId);
  }

  listActiveAlerts(status?: AlertStatus): AlertResult[] {
    const alerts = Array.from(this.activeAlerts.values());
    if (status) {
      return alerts.filter((a) => a.status === status);
    }
    return alerts;
  }

  getAlertHistory(): AlertResult[] {
    return [...this.alertHistory];
  }
}
