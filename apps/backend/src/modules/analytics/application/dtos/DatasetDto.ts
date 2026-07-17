import type { AnalyticsDataset, DatasetType } from "../../domain/models/AnalyticsDataset.js";

export interface DatasetDto {
  id: string;
  name: string;
  type: DatasetType;
  dimensions: string[];
  metrics: string[];
  recordCount: number;
  periodStart: string;
  periodEnd: string;
  builtAt: string;
  data: Record<string, unknown>[];
}

export function toDatasetDto(dataset: AnalyticsDataset): DatasetDto {
  return {
    id: dataset.id,
    name: dataset.name,
    type: dataset.type,
    dimensions: dataset.dimensions,
    metrics: dataset.metrics,
    recordCount: dataset.recordCount(),
    periodStart: dataset.periodStart.toISOString(),
    periodEnd: dataset.periodEnd.toISOString(),
    builtAt: dataset.builtAt.toISOString(),
    data: dataset.data,
  };
}
