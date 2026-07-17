import type { MetricCategory, MetricUnit, MetricPeriod } from "./BusinessMetric.js";

export interface MetricRecordConfig {
  id: string;
  restaurantId: string;
  metricName: string;
  category: MetricCategory;
  value: number;
  unit: MetricUnit;
  period: MetricPeriod;
  periodStart: Date;
  periodEnd: Date;
  dimensions: Record<string, string>;
  recordedAt: Date;
  metadata?: Record<string, unknown>;
}

export class MetricRecord {
  private constructor(public readonly data: MetricRecordConfig) {}

  static create(config: Omit<MetricRecordConfig, "recordedAt">): MetricRecord {
    return new MetricRecord({ ...config, recordedAt: new Date() });
  }

  static reconstitute(config: MetricRecordConfig): MetricRecord {
    return new MetricRecord(config);
  }

  get id(): string { return this.data.id; }
  get restaurantId(): string { return this.data.restaurantId; }
  get metricName(): string { return this.data.metricName; }
  get category(): MetricCategory { return this.data.category; }
  get value(): number { return this.data.value; }
  get unit(): MetricUnit { return this.data.unit; }
  get period(): MetricPeriod { return this.data.period; }
  get periodStart(): Date { return this.data.periodStart; }
  get periodEnd(): Date { return this.data.periodEnd; }
  get dimensions(): Record<string, string> { return this.data.dimensions; }
  get recordedAt(): Date { return this.data.recordedAt; }

  equals(other: MetricRecord): boolean {
    return this.data.id === other.data.id;
  }
}
