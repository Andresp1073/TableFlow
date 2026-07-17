export interface AnalyticsDatasetConfig {
  id: string;
  restaurantId: string;
  name: string;
  type: DatasetType;
  dimensions: string[];
  metrics: string[];
  records: Record<string, unknown>[];
  periodStart: Date;
  periodEnd: Date;
  builtAt: Date;
  metadata?: Record<string, unknown>;
}

export type DatasetType =
  | "aggregated"
  | "historical"
  | "operational"
  | "analytical"
  | "comparative"
  | "trend";

export class AnalyticsDataset {
  private constructor(private readonly config: AnalyticsDatasetConfig) {}

  static create(config: Omit<AnalyticsDatasetConfig, "builtAt">): AnalyticsDataset {
    return new AnalyticsDataset({ ...config, builtAt: new Date() });
  }

  static reconstitute(config: AnalyticsDatasetConfig): AnalyticsDataset {
    return new AnalyticsDataset(config);
  }

  get id(): string { return this.config.id; }
  get restaurantId(): string { return this.config.restaurantId; }
  get name(): string { return this.config.name; }
  get type(): DatasetType { return this.config.type; }
  get dimensions(): string[] { return this.config.dimensions; }
  get metrics(): string[] { return this.config.metrics; }
  get data(): Record<string, unknown>[] { return this.config.records; }
  get periodStart(): Date { return this.config.periodStart; }
  get periodEnd(): Date { return this.config.periodEnd; }
  get builtAt(): Date { return this.config.builtAt; }

  equals(other: AnalyticsDataset): boolean {
    return this.config.id === other.config.id;
  }

  recordCount(): number {
    return this.config.records.length;
  }

  isEmpty(): boolean {
    return this.config.records.length === 0;
  }

  filter(predicate: (record: Record<string, unknown>) => boolean): AnalyticsDataset {
    const filtered = this.config.records.filter(predicate);
    return AnalyticsDataset.reconstitute({ ...this.config, records: filtered });
  }

  aggregate(metricName: string, fn: "sum" | "avg" | "min" | "max"): number {
    const values = this.config.records
      .map((r) => r[metricName])
      .filter((v): v is number => typeof v === "number");
    if (values.length === 0) return 0;
    switch (fn) {
      case "sum": return values.reduce((a, b) => a + b, 0);
      case "avg": return values.reduce((a, b) => a + b, 0) / values.length;
      case "min": return Math.min(...values);
      case "max": return Math.max(...values);
    }
  }
}
