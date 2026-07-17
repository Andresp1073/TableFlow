import type { Forecast, ForecastType, ForecastStatus, ConfidenceLevel, ForecastFactor } from "../../domain/models/Forecast.js";

export interface ForecastDto {
  id: string;
  restaurantId: string;
  type: ForecastType;
  status: ForecastStatus;
  periodStart: string;
  periodEnd: string;
  value: number;
  unit: string;
  confidence: ConfidenceLevel;
  confidenceLower: number | null;
  confidenceUpper: number | null;
  factors: ForecastFactor[];
  historicalDataPoints: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function toForecastDto(forecast: Forecast): ForecastDto {
  return {
    id: forecast.id,
    restaurantId: forecast.restaurantId,
    type: forecast.type,
    status: forecast.status,
    periodStart: forecast.periodStart.toISOString(),
    periodEnd: forecast.periodEnd.toISOString(),
    value: forecast.value,
    unit: forecast.unit,
    confidence: forecast.confidence,
    confidenceLower: forecast.confidenceLower ?? null,
    confidenceUpper: forecast.confidenceUpper ?? null,
    factors: forecast.factors.map((f) => ({ ...f })),
    historicalDataPoints: forecast.historicalDataPoints,
    createdBy: forecast.createdBy,
    createdAt: forecast.createdAt.toISOString(),
    updatedAt: forecast.updatedAt.toISOString(),
  };
}
