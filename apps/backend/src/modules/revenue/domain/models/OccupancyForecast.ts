export enum ForecastConfidence {
  VeryLow = "very_low",
  Low = "low",
  Medium = "medium",
  High = "high",
  VeryHigh = "very_high",
}

export interface ForecastFactor {
  name: string;
  impact: number;
  description: string;
}

export interface OccupancyForecastConfig {
  id: string;
  restaurantId: string;
  date: string;
  timeSlot: string;
  predictedOccupancyRate: number;
  predictedCovers: number;
  predictedRevenue: number;
  confidence: ForecastConfidence;
  lowerBound: number;
  upperBound: number;
  factors: ForecastFactor[];
  generatedAt: Date;
  validUntil: Date;
}

export class OccupancyForecast {
  private constructor(public readonly data: OccupancyForecastConfig) {}

  static create(config: Omit<OccupancyForecastConfig, "generatedAt">): OccupancyForecast {
    return new OccupancyForecast({ ...config, generatedAt: new Date() });
  }

  static reconstitute(config: OccupancyForecastConfig): OccupancyForecast {
    return new OccupancyForecast(config);
  }

  get id(): string { return this.data.id; }
  get restaurantId(): string { return this.data.restaurantId; }
  get date(): string { return this.data.date; }
  get timeSlot(): string { return this.data.timeSlot; }
  get predictedOccupancyRate(): number { return this.data.predictedOccupancyRate; }
  get predictedCovers(): number { return this.data.predictedCovers; }
  get predictedRevenue(): number { return this.data.predictedRevenue; }
  get confidence(): ForecastConfidence { return this.data.confidence; }
  get lowerBound(): number { return this.data.lowerBound; }
  get upperBound(): number { return this.data.upperBound; }
  get factors(): readonly ForecastFactor[] { return this.data.factors; }
  get generatedAt(): Date { return this.data.generatedAt; }
  get validUntil(): Date { return this.data.validUntil; }

  equals(other: OccupancyForecast): boolean { return this.data.id === other.data.id; }

  isExpired(): boolean {
    return new Date() > this.data.validUntil;
  }

  occupancyRange(): string {
    return `${Math.round(this.data.lowerBound * 100)}% - ${Math.round(this.data.upperBound * 100)}%`;
  }
}
