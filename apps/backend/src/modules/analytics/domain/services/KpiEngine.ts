import { KpiDefinition, type KpiFormula, type KpiPeriod, type KpiStatus } from "../models/KpiDefinition.js";
import { KpiRecord } from "../models/KpiRecord.js";
import type { MetricRecord } from "../models/MetricRecord.js";

export interface KpiCalculationParams {
  restaurantId: string;
  period: KpiPeriod;
  periodStart: Date;
  periodEnd: Date;
}

export class KpiEngine {
  calculateValue(definition: KpiDefinition, metricRecords: MetricRecord[]): number {
    if (metricRecords.length === 0) return 0;

    switch (definition.data.formula) {
      case "direct":
        return this.calculateDirect(metricRecords);
      case "average":
        return this.calculateAverage(metricRecords);
      case "sum":
        return this.calculateSum(metricRecords);
      case "ratio":
        return this.calculateRatio(metricRecords);
      case "percentage":
        return this.calculatePercentage(metricRecords);
      case "year_over_year":
        return this.calculateYearOverYear(metricRecords);
      case "week_over_week":
        return this.calculateWeekOverWeek(metricRecords);
      case "month_over_month":
        return this.calculateMonthOverMonth(metricRecords);
      case "custom":
        return definition.data.target;
      default:
        return metricRecords[metricRecords.length - 1]?.value ?? 0;
    }
  }

  private calculateDirect(records: MetricRecord[]): number {
    return records[records.length - 1]?.value ?? 0;
  }

  private calculateAverage(records: MetricRecord[]): number {
    return records.reduce((sum, r) => sum + r.value, 0) / records.length;
  }

  private calculateSum(records: MetricRecord[]): number {
    return records.reduce((sum, r) => sum + r.value, 0);
  }

  private calculateRatio(records: MetricRecord[]): number {
    if (records.length < 2) return 0;
    const numerator = records[records.length - 1]?.value ?? 0;
    const denominator = records[records.length - 2]?.value ?? 0;
    return denominator !== 0 ? numerator / denominator : 0;
  }

  private calculatePercentage(records: MetricRecord[]): number {
    if (records.length < 2) return 0;
    const current = records[records.length - 1]?.value ?? 0;
    const previous = records[records.length - 2]?.value ?? 0;
    return previous !== 0 ? (current - previous) / previous : 0;
  }

  private calculateYearOverYear(records: MetricRecord[]): number {
    return 0;
  }

  private calculateWeekOverWeek(records: MetricRecord[]): number {
    return 0;
  }

  private calculateMonthOverMonth(records: MetricRecord[]): number {
    return 0;
  }

  createRecord(
    definition: KpiDefinition,
    value: number,
    period: KpiPeriod,
    periodStart: Date,
    periodEnd: Date,
  ): KpiRecord {
    const variance = definition.calculateVariance(value);
    const status = definition.evaluateStatus(value);

    return KpiRecord.create({
      id: crypto.randomUUID(),
      kpiDefinitionId: definition.id,
      restaurantId: definition.restaurantId,
      value,
      target: definition.target,
      variance,
      status,
      period,
      periodStart,
      periodEnd,
    });
  }

  calculateMultiple(
    definitions: KpiDefinition[],
    metricRecords: MetricRecord[],
    params: KpiCalculationParams,
  ): KpiRecord[] {
    return definitions.map((def) => {
      const value = this.calculateValue(def, metricRecords);
      return this.createRecord(def, value, params.period, params.periodStart, params.periodEnd);
    });
  }

  filterRecordsByMetricName(records: MetricRecord[], metricName: string): MetricRecord[] {
    return records.filter((r) => r.metricName === metricName);
  }
}
