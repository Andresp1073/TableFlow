import type { MetricPeriod } from "./BusinessMetric.js";
import type { DimensionType } from "./BusinessDimension.js";
import type { ReportFilter } from "./ReportDefinition.js";

export interface AnalyticsQueryConfig {
  id: string;
  restaurantId: string;
  name: string;
  metrics: string[];
  dimensions: DimensionType[];
  filters: ReportFilter[];
  period: MetricPeriod;
  periodStart?: Date;
  periodEnd?: Date;
  comparison?: QueryComparison;
  groupBy?: string[];
  orderBy?: QueryOrderBy[];
  limit?: number;
  createdAt: Date;
}

export interface QueryComparison {
  type: "week_over_week" | "month_over_month" | "year_over_year" | "period_over_period";
  previousPeriodStart: Date;
  previousPeriodEnd: Date;
}

export interface QueryOrderBy {
  field: string;
  direction: "asc" | "desc";
}

export class AnalyticsQuery {
  private constructor(public readonly data: AnalyticsQueryConfig) {}

  static create(config: Omit<AnalyticsQueryConfig, "createdAt">): AnalyticsQuery {
    return new AnalyticsQuery({ ...config, createdAt: new Date() });
  }

  static reconstitute(config: AnalyticsQueryConfig): AnalyticsQuery {
    return new AnalyticsQuery(config);
  }

  get id(): string { return this.data.id; }
  get restaurantId(): string { return this.data.restaurantId; }
  get name(): string { return this.data.name; }
  get metrics(): string[] { return this.data.metrics; }
  get dimensions(): DimensionType[] { return this.data.dimensions; }
  get filters(): ReportFilter[] { return this.data.filters; }
  get period(): MetricPeriod { return this.data.period; }
  get periodStart(): Date | undefined { return this.data.periodStart; }
  get periodEnd(): Date | undefined { return this.data.periodEnd; }
  get comparison(): QueryComparison | undefined { return this.data.comparison; }
  get groupBy(): string[] | undefined { return this.data.groupBy; }
  get orderBy(): QueryOrderBy[] | undefined { return this.data.orderBy; }
  get limit(): number | undefined { return this.data.limit; }
  get createdAt(): Date { return this.data.createdAt; }

  equals(other: AnalyticsQuery): boolean {
    return this.data.id === other.data.id;
  }

  hasComparison(): boolean {
    return !!this.data.comparison;
  }
}
