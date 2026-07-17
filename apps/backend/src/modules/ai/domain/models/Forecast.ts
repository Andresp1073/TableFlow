export type ForecastType =
  | "demand"
  | "occupancy"
  | "revenue"
  | "inventory"
  | "staffing"
  | "reservation";

export type ForecastStatus = "draft" | "calculated" | "confirmed" | "archived";

export type ConfidenceLevel = "high" | "medium" | "low" | "very_low";

export interface ForecastConfig {
  id: string;
  restaurantId: string;
  type: ForecastType;
  status: ForecastStatus;
  periodStart: Date;
  periodEnd: Date;
  value: number;
  unit: string;
  confidence: ConfidenceLevel;
  confidenceLower?: number;
  confidenceUpper?: number;
  factors: ForecastFactor[];
  historicalDataPoints: number;
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForecastFactor {
  name: string;
  impact: number;
  description?: string;
}

export class Forecast {
  private constructor(private readonly config: ForecastConfig) {}

  static create(config: Omit<ForecastConfig, "status" | "createdAt" | "updatedAt">): Forecast {
    const now = new Date();
    return new Forecast({ ...config, status: "draft", createdAt: now, updatedAt: now });
  }

  static reconstitute(config: ForecastConfig): Forecast {
    return new Forecast(config);
  }

  get id(): string { return this.config.id; }
  get restaurantId(): string { return this.config.restaurantId; }
  get type(): ForecastType { return this.config.type; }
  get status(): ForecastStatus { return this.config.status; }
  get periodStart(): Date { return this.config.periodStart; }
  get periodEnd(): Date { return this.config.periodEnd; }
  get value(): number { return this.config.value; }
  get unit(): string { return this.config.unit; }
  get confidence(): ConfidenceLevel { return this.config.confidence; }
  get confidenceLower(): number | undefined { return this.config.confidenceLower; }
  get confidenceUpper(): number | undefined { return this.config.confidenceUpper; }
  get factors(): ForecastFactor[] { return this.config.factors; }
  get historicalDataPoints(): number { return this.config.historicalDataPoints; }
  get createdBy(): string { return this.config.createdBy; }
  get createdAt(): Date { return this.config.createdAt; }
  get updatedAt(): Date { return this.config.updatedAt; }

  confirm(): Forecast {
    return Forecast.reconstitute({ ...this.config, status: "confirmed", updatedAt: new Date() });
  }

  archive(): Forecast {
    return Forecast.reconstitute({ ...this.config, status: "archived", updatedAt: new Date() });
  }

  spanMs(): number {
    return this.config.periodEnd.getTime() - this.config.periodStart.getTime();
  }

  isAccurate(actualValue: number, tolerancePercent: number = 10): boolean {
    if (this.config.value === 0) return actualValue === 0;
    const error = Math.abs((actualValue - this.config.value) / this.config.value) * 100;
    return error <= tolerancePercent;
  }
}
