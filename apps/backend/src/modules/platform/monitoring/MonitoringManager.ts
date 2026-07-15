import type {
  DashboardDefinitionConfig,
  DashboardResult,
  AlertPolicyConfig,
  AlertResult,
  AlertStatus,
  IncidentDefinitionConfig,
  IncidentResult,
  IncidentStatus,
  ServiceLevelIndicatorConfig,
  ServiceLevelObjectiveConfig,
  SliResult,
  SloResult,
  ErrorBudgetResult,
  MonitoringProvider,
  MonitoringProviderType,
} from "./types.js";
import { DashboardDefinition } from "./DashboardDefinition.js";
import { AlertEngine } from "./AlertEngine.js";
import { IncidentManager } from "./IncidentDefinition.js";
import { ServiceLevelIndicator } from "./ServiceLevelIndicator.js";
import { ServiceLevelObjective } from "./ServiceLevelObjective.js";
import { ErrorBudget } from "./ErrorBudget.js";
import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";
import { publishMonitoringEvent } from "./events.js";
import { MonitoringNotFoundError } from "./errors.js";

export class MonitoringManager {
  private readonly dashboards: Map<string, DashboardResult> = new Map();
  private readonly alertEngine: AlertEngine;
  private readonly incidentManager: IncidentManager;
  private readonly slis: Map<string, ServiceLevelIndicator> = new Map();
  private readonly slos: Map<string, ServiceLevelObjective> = new Map();
  private readonly errorBudgets: Map<string, ErrorBudget> = new Map();
  private readonly providers: Map<MonitoringProviderType, MonitoringProvider> = new Map();
  private readonly logger?: Logger;
  private readonly eventPublisher?: EventPublisher;

  constructor(options?: { logger?: Logger; eventPublisher?: EventPublisher }) {
    this.logger = options?.logger;
    this.eventPublisher = options?.eventPublisher;
    this.alertEngine = new AlertEngine({ logger: this.logger, eventPublisher: this.eventPublisher });
    this.incidentManager = new IncidentManager();
  }

  // Dashboard
  registerDashboard(config: DashboardDefinitionConfig): DashboardResult {
    const dashboard = new DashboardDefinition(config);
    const result = dashboard.toResult();
    this.dashboards.set(dashboard.name, result);
    return result;
  }

  getDashboard(name: string): DashboardResult | undefined {
    return this.dashboards.get(name);
  }

  listDashboards(type?: string): DashboardResult[] {
    const all = Array.from(this.dashboards.values());
    if (type) {
      return all.filter((d) => d.type === type);
    }
    return all;
  }

  // Alert Engine delegation
  getAlertEngine(): AlertEngine {
    return this.alertEngine;
  }

  registerAlertPolicy(config: AlertPolicyConfig): void {
    this.alertEngine.registerPolicy(config);
  }

  evaluateAlerts(metrics: Record<string, number>): AlertResult[] {
    return this.alertEngine.evaluateAll(metrics);
  }

  listAlerts(status?: AlertStatus): AlertResult[] {
    return this.alertEngine.listActiveAlerts(status);
  }

  // Incidents
  createIncident(config: IncidentDefinitionConfig): IncidentResult {
    const result = this.incidentManager.create(config);
    publishMonitoringEvent(
      this.eventPublisher,
      this.logger,
      "incident.created",
      config.title,
      { incidentId: result.id, severity: config.severity },
    );
    return result;
  }

  updateIncidentStatus(id: string, status: IncidentStatus, actor?: string): IncidentResult | undefined {
    const result = this.incidentManager.updateStatus(id, status, actor);
    if (result && (status === "resolved" || status === "closed")) {
      publishMonitoringEvent(
        this.eventPublisher,
        this.logger,
        "incident.resolved",
        result.title,
        { incidentId: id, durationMs: result.durationMs },
      );
    }
    return result;
  }

  getIncident(id: string): IncidentResult | undefined {
    return this.incidentManager.get(id);
  }

  listIncidents(status?: IncidentStatus): IncidentResult[] {
    return this.incidentManager.list(status);
  }

  // SLI
  registerSli(config: ServiceLevelIndicatorConfig): ServiceLevelIndicator {
    const sli = new ServiceLevelIndicator(config);
    this.slis.set(sli.name, sli);
    return sli;
  }

  recordSli(name: string, value: number): SliResult | undefined {
    const sli = this.slis.get(name);
    if (!sli) {
      return undefined;
    }
    return sli.record(value);
  }

  getSli(name: string): ServiceLevelIndicator | undefined {
    return this.slis.get(name);
  }

  // SLO
  registerSlo(config: ServiceLevelObjectiveConfig): ServiceLevelObjective {
    const slo = new ServiceLevelObjective(config);
    this.slos.set(slo.name, slo);
    this.errorBudgets.set(slo.name, new ErrorBudget(slo.name, slo.target));
    return slo;
  }

  evaluateSlo(name: string, sliValue: number): SloResult | undefined {
    const slo = this.slos.get(name);
    if (!slo) {
      return undefined;
    }

    const result = slo.evaluate(sliValue);
    const errorBudget = this.errorBudgets.get(name);
    if (errorBudget) {
      if (sliValue < slo.target) {
        errorBudget.consume(slo.target - sliValue);
      }
      result.errorBudget = errorBudget.toResult();

      if (result.compliance === "breached") {
        publishMonitoringEvent(
          this.eventPublisher,
          this.logger,
          "slo.breached",
          name,
          { sliValue, target: slo.target, compliance: "breached" },
        );
      }

      if (errorBudget.getStatus() === "exhausted") {
        publishMonitoringEvent(
          this.eventPublisher,
          this.logger,
          "error_budget.exhausted",
          name,
          { remaining: errorBudget.getRemaining(), consumed: errorBudget.getConsumed() },
        );
      } else if (sliValue < slo.target) {
        publishMonitoringEvent(
          this.eventPublisher,
          this.logger,
          "error_budget.consumed",
          name,
          { consumed: slo.target - sliValue, remaining: errorBudget.getRemaining() },
        );
      }
    }

    return result;
  }

  getErrorBudget(sloName: string): ErrorBudgetResult | undefined {
    return this.errorBudgets.get(sloName)?.toResult();
  }

  // Providers
  registerProvider(provider: MonitoringProvider): void {
    this.providers.set(provider.providerType, provider);
  }

  getProvider(providerType: MonitoringProviderType): MonitoringProvider | undefined {
    return this.providers.get(providerType);
  }
}
