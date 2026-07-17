import { Forecast, type ForecastType, type ConfidenceLevel, type ForecastFactor } from "../models/Forecast.js";

export interface ForecastParams {
  restaurantId: string;
  type: ForecastType;
  periodStart: Date;
  periodEnd: Date;
  historicalValues: number[];
  factors?: ForecastFactor[];
  metadata?: Record<string, unknown>;
  createdBy: string;
}

export interface ForecastStrategy {
  readonly type: ForecastType;
  readonly unit: string;
  generate(params: ForecastParams): { value: number; confidence: ConfidenceLevel; confidenceLower?: number; confidenceUpper?: number; factors: ForecastFactor[] };
}

export class DemandForecastStrategy implements ForecastStrategy {
  readonly type: ForecastType = "demand";
  readonly unit = "covers";

  generate(params: ForecastParams): { value: number; confidence: ConfidenceLevel; confidenceLower?: number; confidenceUpper?: number; factors: ForecastFactor[] } {
    const value = this.calculateAverage(params.historicalValues);
    const confidence = this.determineConfidence(params.historicalValues.length);
    const stdDev = this.standardDeviation(params.historicalValues);
    return {
      value,
      confidence,
      confidenceLower: Math.max(0, value - stdDev),
      confidenceUpper: value + stdDev,
      factors: params.factors ?? this.defaultFactors(params.historicalValues.length),
    };
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private standardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = this.calculateAverage(values);
    const squaredDiffs = values.map((v) => (v - mean) ** 2);
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  private determineConfidence(count: number): ConfidenceLevel {
    if (count >= 30) return "high";
    if (count >= 14) return "medium";
    if (count >= 7) return "low";
    return "very_low";
  }

  private defaultFactors(count: number): ForecastFactor[] {
    return [
      { name: "historical_data_points", impact: Math.min(count / 30, 1), description: "Number of historical data points used" },
    ];
  }
}

export class OccupancyForecastStrategy implements ForecastStrategy {
  readonly type: ForecastType = "occupancy";
  readonly unit = "percentage";

  generate(params: ForecastParams): { value: number; confidence: ConfidenceLevel; confidenceLower?: number; confidenceUpper?: number; factors: ForecastFactor[] } {
    const avg = params.historicalValues.length > 0
      ? params.historicalValues.reduce((a, b) => a + b, 0) / params.historicalValues.length
      : 0;
    const confidence: ConfidenceLevel = params.historicalValues.length >= 30 ? "high" : params.historicalValues.length >= 14 ? "medium" : params.historicalValues.length >= 7 ? "low" : "very_low";
    return { value: avg, confidence, factors: params.factors ?? [] };
  }
}

export class RevenueForecastStrategy implements ForecastStrategy {
  readonly type: ForecastType = "revenue";
  readonly unit = "usd";

  generate(params: ForecastParams): { value: number; confidence: ConfidenceLevel; confidenceLower?: number; confidenceUpper?: number; factors: ForecastFactor[] } {
    const trend = this.calculateTrend(params.historicalValues);
    const confidence: ConfidenceLevel = params.historicalValues.length >= 30 ? "high" : params.historicalValues.length >= 14 ? "medium" : params.historicalValues.length >= 7 ? "low" : "very_low";
    return { value: trend, confidence, factors: params.factors ?? [] };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return values[0] ?? 0;
    const recent = values.slice(-7);
    return recent.reduce((a, b) => a + b, 0) / recent.length;
  }
}

export class InventoryForecastStrategy implements ForecastStrategy {
  readonly type: ForecastType = "inventory";
  readonly unit = "units";

  generate(params: ForecastParams): { value: number; confidence: ConfidenceLevel; confidenceLower?: number; confidenceUpper?: number; factors: ForecastFactor[] } {
    const avgConsumption = params.historicalValues.length > 0
      ? params.historicalValues.reduce((a, b) => a + b, 0) / params.historicalValues.length
      : 0;
    const confidence: ConfidenceLevel = params.historicalValues.length >= 20 ? "high" : params.historicalValues.length >= 10 ? "medium" : params.historicalValues.length >= 5 ? "low" : "very_low";
    return { value: avgConsumption, confidence, factors: params.factors ?? [] };
  }
}

export class StaffingForecastStrategy implements ForecastStrategy {
  readonly type: ForecastType = "staffing";
  readonly unit = "hours";

  generate(params: ForecastParams): { value: number; confidence: ConfidenceLevel; confidenceLower?: number; confidenceUpper?: number; factors: ForecastFactor[] } {
    const avg = params.historicalValues.length > 0
      ? params.historicalValues.reduce((a, b) => a + b, 0) / params.historicalValues.length
      : 0;
    const confidence: ConfidenceLevel = "medium";
    return { value: Math.ceil(avg), confidence, factors: params.factors ?? [] };
  }
}

export class ReservationForecastStrategy implements ForecastStrategy {
  readonly type: ForecastType = "reservation";
  readonly unit = "count";

  generate(params: ForecastParams): { value: number; confidence: ConfidenceLevel; confidenceLower?: number; confidenceUpper?: number; factors: ForecastFactor[] } {
    const avg = params.historicalValues.length > 0
      ? params.historicalValues.reduce((a, b) => a + b, 0) / params.historicalValues.length
      : 0;
    const confidence: ConfidenceLevel = params.historicalValues.length >= 30 ? "high" : params.historicalValues.length >= 14 ? "medium" : params.historicalValues.length >= 7 ? "low" : "very_low";
    return { value: Math.round(avg), confidence, factors: params.factors ?? [] };
  }
}

export class ForecastEngine {
  private readonly strategies = new Map<ForecastType, ForecastStrategy>();

  constructor() {
    this.register(new DemandForecastStrategy());
    this.register(new OccupancyForecastStrategy());
    this.register(new RevenueForecastStrategy());
    this.register(new InventoryForecastStrategy());
    this.register(new StaffingForecastStrategy());
    this.register(new ReservationForecastStrategy());
  }

  register(strategy: ForecastStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  hasStrategy(type: ForecastType): boolean {
    return this.strategies.has(type);
  }

  listTypes(): ForecastType[] {
    return Array.from(this.strategies.keys());
  }

  generate(params: ForecastParams): Forecast {
    const strategy = this.strategies.get(params.type);
    if (!strategy) throw new Error(`No forecast strategy for type: ${params.type}`);

    const result = strategy.generate(params);

    return Forecast.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      type: params.type,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      value: result.value,
      unit: strategy.unit,
      confidence: result.confidence,
      confidenceLower: result.confidenceLower,
      confidenceUpper: result.confidenceUpper,
      factors: result.factors,
      historicalDataPoints: params.historicalValues.length,
      createdBy: params.createdBy,
      metadata: params.metadata,
    });
  }

  generateMultiple(params: ForecastParams[]): Forecast[] {
    return params.map((p) => this.generate(p));
  }
}
