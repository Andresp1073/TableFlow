import type { MetricRecord } from "../models/MetricRecord.js";

export type TrendDirection = "increasing" | "decreasing" | "stable" | "volatile";

export interface TrendAnalysis {
  metricName: string;
  direction: TrendDirection;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  values: number[];
  periodCount: number;
}

export interface ComparisonResult {
  metricName: string;
  currentValue: number;
  previousValue: number;
  absoluteChange: number;
  percentChange: number;
}

export class TrendAnalyzer {
  analyze(records: MetricRecord[]): TrendAnalysis[] {
    const grouped = this.groupByMetricName(records);
    return Array.from(grouped).map(([metricName, metricRecords]) => {
      const sorted = [...metricRecords].sort(
        (a, b) => a.periodStart.getTime() - b.periodStart.getTime(),
      );
      const values = sorted.map((r) => r.value);
      const direction = this.detectDirection(values);
      const currentValue = values[values.length - 1] ?? 0;
      const previousValue = values.length >= 2 ? values[values.length - 2] : 0;
      const changePercent = previousValue !== 0
        ? ((currentValue - previousValue) / previousValue) * 100
        : 0;

      return {
        metricName,
        direction,
        currentValue,
        previousValue,
        changePercent,
        values,
        periodCount: values.length,
      };
    });
  }

  private groupByMetricName(records: MetricRecord[]): Map<string, MetricRecord[]> {
    const grouped = new Map<string, MetricRecord[]>();
    for (const record of records) {
      const existing = grouped.get(record.metricName) ?? [];
      existing.push(record);
      grouped.set(record.metricName, existing);
    }
    return grouped;
  }

  private detectDirection(values: number[]): TrendDirection {
    if (values.length < 3) return "stable";

    const recent = values.slice(-5);
    const differences: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      differences.push(recent[i] - recent[i - 1]);
    }

    const increases = differences.filter((d) => d > 0).length;
    const decreases = differences.filter((d) => d < 0).length;
    const total = differences.length;

    if (increases >= total * 0.8) return "increasing";
    if (decreases >= total * 0.8) return "decreasing";

    const variance = this.calculateVariance(recent);
    if (variance > 0.3) return "volatile";

    return "stable";
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 0;
    const squaredDiffs = values.map((v) => (v - mean) ** 2);
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance) / mean;
  }

  comparePeriods(
    currentRecords: MetricRecord[],
    previousRecords: MetricRecord[],
  ): ComparisonResult[] {
    const currentGrouped = this.groupByMetricName(currentRecords);
    const previousGrouped = this.groupByMetricName(previousRecords);
    const results: ComparisonResult[] = [];

    const allMetrics = new Set([
      ...currentGrouped.keys(),
      ...previousGrouped.keys(),
    ]);

    for (const metricName of allMetrics) {
      const current = this.lastValue(currentGrouped.get(metricName));
      const previous = this.lastValue(previousGrouped.get(metricName));
      const absoluteChange = current - previous;
      const percentChange = previous !== 0 ? (absoluteChange / previous) * 100 : 0;

      results.push({
        metricName,
        currentValue: current,
        previousValue: previous,
        absoluteChange,
        percentChange,
      });
    }

    return results;
  }

  private lastValue(records?: MetricRecord[]): number {
    if (!records || records.length === 0) return 0;
    return records[records.length - 1].value;
  }
}
