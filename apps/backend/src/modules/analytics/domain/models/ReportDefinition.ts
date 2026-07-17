import type { MetricPeriod } from "./BusinessMetric.js";

export interface ReportDefinitionConfig {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  schedule?: ReportSchedule;
  metrics: string[];
  dimensions: string[];
  filters: ReportFilter[];
  format: ReportFormat;
  type: ReportType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ReportSchedule {
  cron: string;
  timezone: string;
  period: MetricPeriod;
  nextRunAt?: Date;
  lastRunAt?: Date;
}

export interface ReportFilter {
  dimension: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
  value: unknown;
}

export type ReportFormat = "json" | "csv" | "summary";

export type ReportType = "scheduled" | "on_demand" | "realtime";

export class ReportDefinition {
  private constructor(public readonly data: ReportDefinitionConfig) {}

  static create(config: Omit<ReportDefinitionConfig, "isActive" | "createdAt" | "updatedAt">): ReportDefinition {
    const now = new Date();
    return new ReportDefinition({ ...config, isActive: true, createdAt: now, updatedAt: now });
  }

  static reconstitute(config: ReportDefinitionConfig): ReportDefinition {
    return new ReportDefinition(config);
  }

  get id(): string { return this.data.id; }
  get restaurantId(): string { return this.data.restaurantId; }
  get name(): string { return this.data.name; }
  get description(): string | undefined { return this.data.description; }
  get schedule(): ReportSchedule | undefined { return this.data.schedule; }
  get metrics(): string[] { return this.data.metrics; }
  get dimensions(): string[] { return this.data.dimensions; }
  get filters(): ReportFilter[] { return this.data.filters; }
  get format(): ReportFormat { return this.data.format; }
  get type(): ReportType { return this.data.type; }
  get isActive(): boolean { return this.data.isActive; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  equals(other: ReportDefinition): boolean {
    return this.data.id === other.data.id;
  }

  activate(): ReportDefinition {
    return ReportDefinition.reconstitute({ ...this.data, isActive: true, updatedAt: new Date() });
  }

  deactivate(): ReportDefinition {
    return ReportDefinition.reconstitute({ ...this.data, isActive: false, updatedAt: new Date() });
  }

  updateSchedule(schedule: ReportSchedule): ReportDefinition {
    return ReportDefinition.reconstitute({ ...this.data, schedule, updatedAt: new Date() });
  }

  isScheduled(): boolean {
    return this.data.type === "scheduled" && !!this.data.schedule;
  }
}
