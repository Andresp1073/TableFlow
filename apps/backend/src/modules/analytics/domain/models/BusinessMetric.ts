export interface BusinessMetricConfig {
  id: string;
  restaurantId: string;
  name: string;
  category: MetricCategory;
  value: number;
  unit: MetricUnit;
  period: MetricPeriod;
  timestamp: Date;
  dimensions: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export type MetricCategory =
  | "financial"
  | "operational"
  | "customer"
  | "inventory"
  | "kitchen"
  | "reservation"
  | "satisfaction";

export type MetricUnit =
  | "usd"
  | "count"
  | "percentage"
  | "minutes"
  | "ratio"
  | "hours"
  | "covers";

export type MetricPeriod =
  | "realtime"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

export class BusinessMetric {
  private constructor(public readonly data: BusinessMetricConfig) {}

  static create(config: Omit<BusinessMetricConfig, "timestamp">): BusinessMetric {
    return new BusinessMetric({ ...config, timestamp: new Date() });
  }

  static reconstitute(config: BusinessMetricConfig): BusinessMetric {
    return new BusinessMetric(config);
  }

  get id(): string { return this.data.id; }
  get restaurantId(): string { return this.data.restaurantId; }
  get name(): string { return this.data.name; }
  get category(): MetricCategory { return this.data.category; }
  get value(): number { return this.data.value; }
  get unit(): MetricUnit { return this.data.unit; }
  get period(): MetricPeriod { return this.data.period; }
  get timestamp(): Date { return this.data.timestamp; }
  get dimensions(): Record<string, string> { return this.data.dimensions; }

  equals(other: BusinessMetric): boolean {
    return this.data.id === other.data.id;
  }

  isPositive(): boolean {
    return this.data.value >= 0;
  }

  formatted(): string {
    const unitSymbols: Record<MetricUnit, string> = {
      usd: "$",
      count: "",
      percentage: "%",
      minutes: "m",
      ratio: "",
      hours: "h",
      covers: " covers",
    };
    const symbol = unitSymbols[this.data.unit];
    if (this.data.unit === "percentage") {
      return `${(this.data.value * 100).toFixed(1)}${symbol}`;
    }
    if (this.data.unit === "usd") {
      return `${symbol}${this.data.value.toFixed(2)}`;
    }
    return `${this.data.value}${symbol}`;
  }
}
