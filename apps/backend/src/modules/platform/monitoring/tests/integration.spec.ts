import { describe, it, expect, vi } from "vitest";
import { MonitoringManager } from "../MonitoringManager.js";
import { DashboardDefinition } from "../DashboardDefinition.js";
import { AlertPolicy } from "../AlertPolicy.js";
import { AlertEngine } from "../AlertEngine.js";
import { ServiceLevelIndicator } from "../ServiceLevelIndicator.js";
import { ServiceLevelObjective } from "../ServiceLevelObjective.js";
import { ErrorBudget } from "../ErrorBudget.js";
import { IncidentDefinition, IncidentManager } from "../IncidentDefinition.js";
import {
  MonitoringError,
  MonitoringValidationError,
  MonitoringNotFoundError,
  AlertEvaluationError,
  SloBreachError,
} from "../errors.js";
import { createMonitoringEvent, publishMonitoringEvent } from "../events.js";
import {
  DASHBOARD_TYPES,
  ALERT_TYPES,
  SLI_TYPES,
  MONITORING_PROVIDER_TYPES,
} from "../types.js";

describe("Integration - MonitoringManager Full Workflow", () => {
  it("manages full alert lifecycle", async () => {
    const events: string[] = [];
    const publisher = {
      async publish(event: { type: string }) { events.push(event.type); },
      async publishMany() {},
    };

    const manager = new MonitoringManager({ eventPublisher: publisher });

    manager.registerAlertPolicy(AlertPolicy.createThreshold("high-cpu", "cpu_usage", 80, "critical").toConfig());
    manager.registerAlertPolicy(AlertPolicy.createLatency("high-latency", "latency_ms", 500, "high").toConfig());
    manager.registerAlertPolicy(AlertPolicy.createErrorRate("high-errors", "error_rate", 5, "medium").toConfig());

    const alerts = manager.evaluateAlerts({ cpu_usage: 95, latency_ms: 600, error_rate: 3 });
    expect(alerts).toHaveLength(2);

    expect(events).toContain("alert.triggered");

    const resolved = manager.getAlertEngine().resolveAlert(alerts[0]!.id);
    expect(resolved!.status).toBe("resolved");

    expect(events).toContain("alert.resolved");
  });

  it("manages full incident lifecycle", () => {
    const manager = new MonitoringManager();

    const incident = manager.createIncident({
      title: "Production Incident",
      description: "High CPU on backend instances",
      severity: "sev1",
      service: "backend",
    });
    expect(incident.status).toBe("firing");

    const acked = manager.updateIncidentStatus(incident.id, "acknowledged", "sre@example.com");
    expect(acked!.status).toBe("acknowledged");

    const resolved = manager.updateIncidentStatus(incident.id, "resolved", "sre@example.com");
    expect(resolved!.status).toBe("resolved");

    const list = manager.listIncidents();
    expect(list).toHaveLength(1);
  });

  it("manages SLO lifecycle", () => {
    const manager = new MonitoringManager();

    const slo = ServiceLevelObjective.createAvailability("api-slo", "sum(up)", "count(up)", 99.9);
    manager.registerSlo({
      name: slo.name, description: slo.description,
      sli: {
        name: slo.sli.name, type: slo.sli.type, metric: slo.sli.metric,
        numeratorQuery: slo.sli.numeratorQuery, denominatorQuery: slo.sli.denominatorQuery,
        evaluationWindowMs: slo.sli.evaluationWindowMs, targetValue: slo.sli.targetValue,
      },
      target: slo.target, warningThreshold: slo.warningThreshold,
      windowMs: slo.windowMs, calendarAligned: slo.calendarAligned,
      errorBudgetInitial: slo.target,
    });

    let result = manager.evaluateSlo("api-slo", 99.95)!;
    expect(result.compliance).toBe("achieved");

    result = manager.evaluateSlo("api-slo", 99.5)!;
    expect(result.compliance).toBe("warning");

    result = manager.evaluateSlo("api-slo", 95.0)!;
    expect(result.compliance).toBe("breached");
    expect(result.errorBudget.consumed).toBeGreaterThan(0);

    const budget = manager.getErrorBudget("api-slo")!;
    expect(budget.status).toBe("exhausted");
  });
});

describe("Integration - Dashboard Registration", () => {
  it("registers and retrieves dashboards", () => {
    const manager = new MonitoringManager();
    const section = { title: "CPU", type: "chart" as const, metric: "cpu", width: 6 as const, height: 300 };

    manager.registerDashboard(DashboardDefinition.createPlatform("platform", [section]).toConfig());
    manager.registerDashboard(DashboardDefinition.createApplication("app", [section]).toConfig());
    manager.registerDashboard(DashboardDefinition.createInfrastructure("infra", [section]).toConfig());
    manager.registerDashboard(DashboardDefinition.createBusiness("biz", [section]).toConfig());

    expect(manager.listDashboards()).toHaveLength(4);
    expect(manager.listDashboards("platform")).toHaveLength(1);
    expect(manager.getDashboard("app")).toBeDefined();
    expect(manager.getDashboard("unknown")).toBeUndefined();
  });
});

describe("Integration - Constants and Types", () => {
  it("defines all dashboard types", () => {
    expect(DASHBOARD_TYPES).toHaveLength(4);
    expect(DASHBOARD_TYPES).toContain("platform");
    expect(DASHBOARD_TYPES).toContain("business");
  });

  it("defines all alert types", () => {
    expect(ALERT_TYPES).toHaveLength(6);
    expect(ALERT_TYPES).toContain("threshold");
    expect(ALERT_TYPES).toContain("anomaly");
    expect(ALERT_TYPES).toContain("capacity");
  });

  it("defines all SLI types", () => {
    expect(SLI_TYPES).toHaveLength(5);
    expect(SLI_TYPES).toContain("availability");
    expect(SLI_TYPES).toContain("recovery_time");
  });

  it("defines all monitoring provider types", () => {
    expect(MONITORING_PROVIDER_TYPES).toHaveLength(6);
    expect(MONITORING_PROVIDER_TYPES).toContain("prometheus");
    expect(MONITORING_PROVIDER_TYPES).toContain("datadog");
    expect(MONITORING_PROVIDER_TYPES).toContain("cloudwatch");
  });
});

describe("Integration - Error Classes", () => {
  it("creates monitoring errors with codes", () => {
    const error = new MonitoringError("Monitor failed", "MONITOR_ERROR");
    expect(error.message).toBe("Monitor failed");
    expect(error.code).toBe("MONITOR_ERROR");
  });

  it("creates validation errors", () => {
    const error = new MonitoringValidationError("Invalid config", ["Name required"]);
    expect(error.code).toBe("MONITORING_VALIDATION_ERROR");
    expect(error.validationErrors).toHaveLength(1);
  });

  it("creates not found errors", () => {
    const error = new MonitoringNotFoundError("dashboard", "overview");
    expect(error.resourceName).toBe("overview");
  });

  it("creates alert evaluation errors", () => {
    const error = new AlertEvaluationError("high-cpu", "Evaluation failed");
    expect(error.policyName).toBe("high-cpu");
  });

  it("creates SLO breach errors", () => {
    const error = new SloBreachError("api-slo", "Budget exhausted");
    expect(error.sloName).toBe("api-slo");
  });
});

describe("Integration - Events", () => {
  it("creates monitoring events", () => {
    const event = createMonitoringEvent("alert.triggered", "high-cpu", { value: 95 });
    expect(event.type).toBe("alert.triggered");
    expect(event.payload.resourceName).toBe("high-cpu");
    expect(event.payload.value).toBe(95);
  });

  it("publishes events silently when no publisher", async () => {
    const logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn(), fatal: vi.fn(), log: vi.fn(), child: vi.fn() } as any;
    await publishMonitoringEvent(undefined, logger, "incident.created", "test");
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("defines all event types", () => {
    const eventTypes = [
      "alert.triggered",
      "alert.resolved",
      "alert.acknowledged",
      "incident.created",
      "incident.updated",
      "incident.resolved",
      "slo.breached",
      "slo.warning",
      "error_budget.consumed",
      "error_budget.exhausted",
    ];
    for (const et of eventTypes) {
      const event = createMonitoringEvent(et as any, "test");
      expect(event.type).toBe(et);
    }
  });
});

describe("Integration - Provider Registration", () => {
  it("registers and retrieves providers", () => {
    const manager = new MonitoringManager();
    const provider = {
      name: "test-provider",
      providerType: "prometheus" as const,
      query: vi.fn(),
      recordEvent: vi.fn(),
    };

    manager.registerProvider(provider);
    expect(manager.getProvider("prometheus")).toBe(provider);
    expect(manager.getProvider("datadog")).toBeUndefined();
  });
});
