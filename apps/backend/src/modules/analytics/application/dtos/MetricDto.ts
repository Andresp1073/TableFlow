import type { BusinessMetric, MetricCategory, MetricUnit, MetricPeriod } from "../../domain/models/BusinessMetric.js";

export interface MetricDto {
  id: string;
  restaurantId: string;
  name: string;
  category: MetricCategory;
  value: number;
  unit: MetricUnit;
  period: MetricPeriod;
  timestamp: string;
  dimensions: Record<string, string>;
  formatted: string;
}

export function toMetricDto(metric: BusinessMetric): MetricDto {
  return {
    id: metric.id,
    restaurantId: metric.restaurantId,
    name: metric.name,
    category: metric.category,
    value: metric.value,
    unit: metric.unit,
    period: metric.period,
    timestamp: metric.timestamp.toISOString(),
    dimensions: metric.dimensions,
    formatted: metric.formatted(),
  };
}
