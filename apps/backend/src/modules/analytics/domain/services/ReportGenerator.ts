import type { MetricRecord } from "../models/MetricRecord.js";
import { AnalyticsReport } from "../models/AnalyticsReport.js";
import type { ReportFormat, ReportType } from "../models/ReportDefinition.js";
import type { AnalyticsDataset } from "../models/AnalyticsDataset.js";
import type { TrendAnalysis, ComparisonResult } from "./TrendAnalyzer.js";

export interface ReportGenerationParams {
  restaurantId: string;
  name: string;
  definitionId?: string;
  format: ReportFormat;
  parameters: Record<string, unknown>;
  periodStart?: Date;
  periodEnd?: Date;
}

export class ReportGenerator {
  generateFromData(
    params: ReportGenerationParams,
    data: Record<string, unknown>[],
  ): AnalyticsReport {
    return AnalyticsReport.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      name: params.name,
      definitionId: params.definitionId,
      type: "on_demand",
      format: params.format,
      records: data,
      parameters: params.parameters,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    });
  }

  generateFromDataset(
    params: ReportGenerationParams,
    dataset: AnalyticsDataset,
  ): AnalyticsReport {
    const summary: Record<string, unknown> = {};
    for (const metric of dataset.metrics) {
      const values = dataset.data
        .map((r) => r[metric])
        .filter((v): v is number => typeof v === "number");
      if (values.length > 0) {
        summary[metric] = {
          sum: values.reduce((a, b) => a + b, 0),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    }

    return AnalyticsReport.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      name: params.name,
      definitionId: params.definitionId,
      type: "on_demand",
      format: params.format,
      records: dataset.data,
      summary,
      parameters: params.parameters,
      periodStart: params.periodStart ?? dataset.periodStart,
      periodEnd: params.periodEnd ?? dataset.periodEnd,
    });
  }

  generateTrendReport(
    params: ReportGenerationParams,
    trends: TrendAnalysis[],
  ): AnalyticsReport {
    const data = trends.map((t) => ({
      metric: t.metricName,
      direction: t.direction,
      currentValue: t.currentValue,
      previousValue: t.previousValue,
      changePercent: t.changePercent,
      periodCount: t.periodCount,
    }));

    return AnalyticsReport.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      name: params.name,
      definitionId: params.definitionId,
      type: "on_demand",
      format: params.format,
      records: data,
      parameters: params.parameters,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    });
  }

  generateComparisonReport(
    params: ReportGenerationParams,
    comparisons: ComparisonResult[],
  ): AnalyticsReport {
    const data = comparisons.map((c) => ({
      metric: c.metricName,
      currentValue: c.currentValue,
      previousValue: c.previousValue,
      absoluteChange: c.absoluteChange,
      percentChange: c.percentChange,
    }));

    return AnalyticsReport.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      name: params.name,
      definitionId: params.definitionId,
      type: "on_demand",
      format: params.format,
      records: data,
      parameters: params.parameters,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    });
  }

  generateGrowthReport(
    params: ReportGenerationParams,
    records: MetricRecord[],
  ): AnalyticsReport {
    const grouped = this.groupRecordsByMetric(records);
    const data = Array.from(grouped.entries()).map(([metricName, metricRecords]) => {
      const sorted = [...metricRecords].sort(
        (a, b) => a.periodStart.getTime() - b.periodStart.getTime(),
      );
      const firstValue = sorted[0]?.value ?? 0;
      const lastValue = sorted[sorted.length - 1]?.value ?? 0;
      const totalGrowth = firstValue !== 0
        ? ((lastValue - firstValue) / firstValue) * 100
        : 0;
      const periodGrowth = this.calculatePeriodGrowth(sorted);

      return {
        metric: metricName,
        firstValue,
        lastValue,
        totalGrowth,
        periodGrowth,
        periods: sorted.length,
      };
    });

    return AnalyticsReport.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      name: params.name,
      definitionId: params.definitionId,
      type: "on_demand",
      format: params.format,
      records: data,
      parameters: params.parameters,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    });
  }

  generatePerformanceReport(
    params: ReportGenerationParams,
    datasets: AnalyticsDataset[],
  ): AnalyticsReport {
    const combined: Record<string, unknown>[] = [];
    for (const dataset of datasets) {
      for (const row of dataset.data) {
        combined.push({ ...row, dataset: dataset.name, datasetType: dataset.type });
      }
    }

    const summary: Record<string, unknown> = {
      datasetsUsed: datasets.length,
      totalRecords: combined.length,
      datasetNames: datasets.map((d) => d.name),
    };

    return AnalyticsReport.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      name: params.name,
      definitionId: params.definitionId,
      type: "on_demand",
      format: params.format,
      records: combined,
      summary,
      parameters: params.parameters,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    });
  }

  generateEfficiencyReport(
    params: ReportGenerationParams,
    records: MetricRecord[],
  ): AnalyticsReport {
    const operationalMetrics = records.filter((r) => r.category === "operational" || r.category === "kitchen");
    const financialMetrics = records.filter((r) => r.category === "financial");

    const avgOperational = operationalMetrics.length > 0
      ? operationalMetrics.reduce((s, r) => s + r.value, 0) / operationalMetrics.length
      : 0;
    const avgFinancial = financialMetrics.length > 0
      ? financialMetrics.reduce((s, r) => s + r.value, 0) / financialMetrics.length
      : 0;

    const data = [
      { category: "operational", average: avgOperational, metricCount: operationalMetrics.length },
      { category: "financial", average: avgFinancial, metricCount: financialMetrics.length },
      {
        category: "efficiency_ratio",
        value: avgFinancial !== 0 ? avgOperational / avgFinancial : 0,
      },
    ];

    return AnalyticsReport.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      name: params.name,
      definitionId: params.definitionId,
      type: "on_demand",
      format: params.format,
      records: data,
      parameters: params.parameters,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    });
  }

  generateScheduledReport(
    params: ReportGenerationParams,
    records: MetricRecord[],
  ): AnalyticsReport {
    const grouped = this.groupRecordsByMetric(records);
    const data: Record<string, unknown>[] = [];
    for (const [metricName, metricRecords] of grouped) {
      const values = metricRecords.map((r) => r.value);
      data.push({
        metric: metricName,
        current: values[values.length - 1] ?? 0,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        trend: values.length >= 2
          ? values[values.length - 1] - values[values.length - 2]
          : 0,
        sampleSize: values.length,
      });
    }

    return AnalyticsReport.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      name: params.name,
      definitionId: params.definitionId,
      type: "scheduled",
      format: params.format,
      records: data,
      parameters: params.parameters,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    });
  }

  private groupRecordsByMetric(records: MetricRecord[]): Map<string, MetricRecord[]> {
    const grouped = new Map<string, MetricRecord[]>();
    for (const record of records) {
      const existing = grouped.get(record.metricName) ?? [];
      existing.push(record);
      grouped.set(record.metricName, existing);
    }
    return grouped;
  }

  private calculatePeriodGrowth(sorted: MetricRecord[]): number[] {
    const growth: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1].value;
      const curr = sorted[i].value;
      growth.push(prev !== 0 ? ((curr - prev) / prev) * 100 : 0);
    }
    return growth;
  }
}
