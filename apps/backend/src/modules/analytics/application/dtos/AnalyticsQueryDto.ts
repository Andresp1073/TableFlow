import type { AnalyticsQuery, QueryComparison, QueryOrderBy } from "../../domain/models/AnalyticsQuery.js";
import type { MetricPeriod } from "../../domain/models/BusinessMetric.js";
import type { DimensionType } from "../../domain/models/BusinessDimension.js";
import type { ReportFilter } from "../../domain/models/ReportDefinition.js";

export interface CreateAnalyticsQueryDto {
  name: string;
  metrics: string[];
  dimensions: DimensionType[];
  filters: ReportFilter[];
  period: MetricPeriod;
  periodStart?: string;
  periodEnd?: string;
  comparison?: QueryComparison;
  groupBy?: string[];
  orderBy?: QueryOrderBy[];
  limit?: number;
}

export interface AnalyticsQueryDto {
  id: string;
  name: string;
  metrics: string[];
  dimensions: DimensionType[];
  filters: ReportFilter[];
  period: MetricPeriod;
  periodStart?: string;
  periodEnd?: string;
  hasComparison: boolean;
  createdAt: string;
}

export function toAnalyticsQueryDto(query: AnalyticsQuery): AnalyticsQueryDto {
  return {
    id: query.id,
    name: query.name,
    metrics: query.metrics,
    dimensions: query.dimensions,
    filters: query.filters,
    period: query.period,
    periodStart: query.periodStart?.toISOString(),
    periodEnd: query.periodEnd?.toISOString(),
    hasComparison: query.hasComparison(),
    createdAt: query.createdAt.toISOString(),
  };
}
