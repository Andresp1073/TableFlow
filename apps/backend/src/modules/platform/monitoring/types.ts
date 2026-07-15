import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";

export type DashboardType = "platform" | "application" | "infrastructure" | "business";

export const DASHBOARD_TYPES: DashboardType[] = [
  "platform",
  "application",
  "infrastructure",
  "business",
];

export type AlertType =
  | "threshold"
  | "anomaly"
  | "availability"
  | "latency"
  | "error_rate"
  | "capacity";

export const ALERT_TYPES: AlertType[] = [
  "threshold",
  "anomaly",
  "availability",
  "latency",
  "error_rate",
  "capacity",
];

export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";

export type AlertStatus = "firing" | "acknowledged" | "resolved" | "silenced";

export type AlertCondition = "above" | "below" | "equals" | "changed";

export type SliType =
  | "availability"
  | "latency"
  | "success_rate"
  | "error_rate"
  | "recovery_time";

export const SLI_TYPES: SliType[] = [
  "availability",
  "latency",
  "success_rate",
  "error_rate",
  "recovery_time",
];

export type SloCompliance = "achieved" | "breached" | "warning" | "exhausted";

export type IncidentSeverity = "sev0" | "sev1" | "sev2" | "sev3" | "sev4";

export type IncidentStatus = "firing" | "acknowledged" | "mitigating" | "resolved" | "closed";

export type MonitoringProviderType =
  | "prometheus"
  | "grafana"
  | "datadog"
  | "new_relic"
  | "azure_monitor"
  | "cloudwatch";

export const MONITORING_PROVIDER_TYPES: MonitoringProviderType[] = [
  "prometheus",
  "grafana",
  "datadog",
  "new_relic",
  "azure_monitor",
  "cloudwatch",
];

export type MonitoringEventType =
  | "alert.triggered"
  | "alert.resolved"
  | "alert.acknowledged"
  | "incident.created"
  | "incident.updated"
  | "incident.resolved"
  | "slo.breached"
  | "slo.warning"
  | "error_budget.consumed"
  | "error_budget.exhausted";

export interface DashboardSection {
  title: string;
  type: "chart" | "table" | "stat" | "heatmap" | "list";
  metric: string;
  query?: string;
  width: 1 | 2 | 3 | 4 | 6 | 12;
  height: number;
  refreshIntervalMs?: number;
  thresholds?: DashboardThreshold[];
}

export interface DashboardThreshold {
  color: string;
  value: number;
  label?: string;
}

export interface DashboardDefinitionConfig {
  name: string;
  type: DashboardType;
  title: string;
  description?: string;
  sections: DashboardSection[];
  tags?: string[];
  timeRangeDefaultMs?: number;
  autoRefreshMs?: number;
}

export interface AlertPolicyConfig {
  name: string;
  type: AlertType;
  severity: AlertSeverity;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  duration: string;
  evaluationIntervalMs: number;
  description?: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  notificationChannels?: string[];
  cooldownMs: number;
  enabled: boolean;
}

export interface AlertResult {
  id: string;
  policyName: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  metric: string;
  value: number;
  threshold: number;
  condition: AlertCondition;
  triggeredAt: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  durationMs: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

export interface ServiceLevelIndicatorConfig {
  name: string;
  type: SliType;
  description?: string;
  metric: string;
  filter?: string;
  numeratorQuery: string;
  denominatorQuery: string;
  evaluationWindowMs: number;
  targetValue: number;
}

export interface ServiceLevelObjectiveConfig {
  name: string;
  description?: string;
  sli: ServiceLevelIndicatorConfig;
  target: number;
  warningThreshold: number;
  windowMs: number;
  calendarAligned: boolean;
  errorBudgetInitial: number;
}

export interface ErrorBudgetResult {
  sloName: string;
  totalBudget: number;
  remaining: number;
  consumed: number;
  consumptionRate: number;
  estimatedDepletionDate?: Date;
  status: "healthy" | "warning" | "exhausted";
  lastUpdated: Date;
}

export interface IncidentDefinitionConfig {
  title: string;
  description: string;
  severity: IncidentSeverity;
  alertId?: string;
  service?: string;
  assignee?: string;
  escalationPolicy?: EscalationPolicyConfig;
  tags?: string[];
}

export interface EscalationPolicyConfig {
  levels: EscalationLevel[];
  defaultTimeoutMs: number;
}

export interface EscalationLevel {
  name: string;
  notify: string[];
  timeoutMs: number;
}

export interface IncidentTimelineEntry {
  timestamp: Date;
  type: "created" | "acknowledged" | "mitigated" | "resolved" | "closed" | "note" | "escalated";
  message: string;
  actor?: string;
}

export interface IncidentResult {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  alertId?: string;
  service?: string;
  assignee?: string;
  escalationPolicy?: EscalationPolicyConfig;
  timeline: IncidentTimelineEntry[];
  tags: string[];
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  durationMs?: number;
}

export interface SliResult {
  name: string;
  type: SliType;
  currentValue: number;
  targetValue: number;
  windowMs: number;
  timestamp: Date;
}

export interface SloResult {
  name: string;
  sli: SliResult;
  target: number;
  compliance: SloCompliance;
  errorBudget: ErrorBudgetResult;
  windowMs: number;
  timestamp: Date;
}

export interface DashboardResult {
  name: string;
  type: DashboardType;
  title: string;
  sections: DashboardSection[];
  tags: string[];
}

export interface MonitoringProvider {
  readonly name: string;
  readonly providerType: MonitoringProviderType;
  query(metric: string, query?: string): Promise<number>;
  recordEvent(name: string, value: number, labels: Record<string, string>): Promise<void>;
}

export interface MonitoringManagerInterface {
  registerDashboard(config: DashboardDefinitionConfig): DashboardResult;
  registerAlertPolicy(config: AlertPolicyConfig): AlertPolicyConfig;
  evaluateAlert(policyName: string, value: number): Promise<AlertResult>;
  createIncident(config: IncidentDefinitionConfig): Promise<IncidentResult>;
  updateIncidentStatus(id: string, status: IncidentStatus, actor?: string): Promise<IncidentResult>;
  recordSli(config: ServiceLevelIndicatorConfig, value: number): Promise<SliResult>;
  evaluateSlo(config: ServiceLevelObjectiveConfig): Promise<SloResult>;
  getErrorBudget(sloName: string): ErrorBudgetResult | undefined;
  getIncident(id: string): IncidentResult | undefined;
  listIncidents(status?: IncidentStatus): IncidentResult[];
  listAlerts(status?: AlertStatus): AlertResult[];
}

export interface MonitoringManagerOptions {
  logger?: Logger;
  eventPublisher?: EventPublisher;
}
