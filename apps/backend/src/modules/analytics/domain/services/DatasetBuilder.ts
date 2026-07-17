import type { MetricRecord } from "../models/MetricRecord.js";
import { AnalyticsDataset, type DatasetType } from "../models/AnalyticsDataset.js";

export interface DatasetBuildParams {
  restaurantId: string;
  name: string;
  type: DatasetType;
  dimensions: string[];
  metrics: string[];
  periodStart: Date;
  periodEnd: Date;
}

export class DatasetBuilder {
  buildAggregated(params: DatasetBuildParams, records: MetricRecord[]): AnalyticsDataset {
    const grouped = this.groupByDimensions(records, params.dimensions);
    const data = Array.from(grouped.entries()).map(([key, group]) => {
      const dimValues = this.parseDimensionKey(key);
      const aggregated: Record<string, unknown> = { ...dimValues };
      for (const metric of params.metrics) {
        const metricRecords = group.filter((r) => r.metricName === metric);
        aggregated[metric] = metricRecords.length > 0
          ? metricRecords.reduce((s, r) => s + r.value, 0) / metricRecords.length
          : 0;
        aggregated[`${metric}_sum`] = metricRecords.reduce((s, r) => s + r.value, 0);
        aggregated[`${metric}_count`] = metricRecords.length;
      }
      return aggregated;
    });

    return AnalyticsDataset.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      name: params.name,
      type: "aggregated",
      dimensions: params.dimensions,
      metrics: params.metrics,
      records: data,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    });
  }

  buildHistorical(params: DatasetBuildParams, records: MetricRecord[]): AnalyticsDataset {
    const data = records.map((r) => ({
      metricName: r.metricName,
      category: r.category,
      value: r.value,
      unit: r.unit,
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
      recordedAt: r.recordedAt.toISOString(),
      ...r.dimensions,
    }));

    return AnalyticsDataset.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      name: params.name,
      type: "historical",
      dimensions: params.dimensions,
      metrics: params.metrics,
      records: data,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    });
  }

  buildOperational(params: DatasetBuildParams, records: MetricRecord[]): AnalyticsDataset {
    const latestRecords = new Map<string, MetricRecord>();
    for (const record of records) {
      const key = `${record.metricName}:${JSON.stringify(record.dimensions)}`;
      const existing = latestRecords.get(key);
      if (!existing || record.recordedAt > existing.recordedAt) {
        latestRecords.set(key, record);
      }
    }

    const data = Array.from(latestRecords.values()).map((r) => ({
      metricName: r.metricName,
      value: r.value,
      unit: r.unit,
      status: r.value > 0 ? "active" : "inactive",
      recordedAt: r.recordedAt.toISOString(),
      ...r.dimensions,
    }));

    return AnalyticsDataset.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      name: params.name,
      type: "operational",
      dimensions: params.dimensions,
      metrics: params.metrics,
      records: data,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    });
  }

  buildAnalytical(params: DatasetBuildParams, records: MetricRecord[]): AnalyticsDataset {
    const metricNames = [...new Set(records.map((r) => r.metricName))];
    const dimensions = params.dimensions;

    const pivotMap = new Map<string, Record<string, unknown>>();
    for (const record of records) {
      const dimKey = dimensions.map((d) => `${d}=${record.dimensions[d] ?? ""}`).join("|");
      const timeKey = record.periodStart.toISOString();

      const compositeKey = `${dimKey}::${timeKey}`;
      let row = pivotMap.get(compositeKey);
      if (!row) {
        row = { periodStart: record.periodStart.toISOString(), periodEnd: record.periodEnd.toISOString() };
        for (const dim of dimensions) {
          row[dim] = record.dimensions[dim] ?? "";
        }
        pivotMap.set(compositeKey, row);
      }
      row[record.metricName] = record.value;
    }

    const data = Array.from(pivotMap.values());
    return AnalyticsDataset.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      name: params.name,
      type: "analytical",
      dimensions: params.dimensions,
      metrics: metricNames,
      records: data,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    });
  }

  private groupByDimensions(
    records: MetricRecord[],
    dimensions: string[],
  ): Map<string, MetricRecord[]> {
    const grouped = new Map<string, MetricRecord[]>();
    for (const record of records) {
      const key = this.makeDimensionKey(record, dimensions);
      const group = grouped.get(key) ?? [];
      group.push(record);
      grouped.set(key, group);
    }
    return grouped;
  }

  private makeDimensionKey(record: MetricRecord, dimensions: string[]): string {
    return dimensions.map((d) => `${d}=${record.dimensions[d] ?? ""}`).join("|");
  }

  private parseDimensionKey(key: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const part of key.split("|")) {
      const eqIndex = part.indexOf("=");
      if (eqIndex > 0) {
        result[part.slice(0, eqIndex)] = part.slice(eqIndex + 1);
      }
    }
    return result;
  }
}
