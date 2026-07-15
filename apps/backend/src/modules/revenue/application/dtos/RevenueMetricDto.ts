import type { RevenueMetric } from "../../domain/models/RevenueMetric.js";
import type { OccupancyForecast } from "../../domain/models/OccupancyForecast.js";
import type { OptimizationRecommendation } from "../../domain/models/OptimizationRecommendation.js";

export type RevenueMetricDto = {
  id: string; restaurantId: string; date: string; timeSlot: string;
  totalCovers: number; totalRevenue: number; averageCheck: number;
  revenuePerAvailableCover: number; tableTurns: number;
  occupancyRate: number; cancellationRate: number; noShowRate: number;
};

export function toRevenueMetricDto(m: RevenueMetric): RevenueMetricDto {
  return {
    id: m.id, restaurantId: m.restaurantId, date: m.date, timeSlot: m.timeSlot,
    totalCovers: m.totalCovers, totalRevenue: m.totalRevenue,
    averageCheck: m.averageCheck,
    revenuePerAvailableCover: m.revenuePerAvailableCover,
    tableTurns: m.tableTurns, occupancyRate: m.occupancyRate,
    cancellationRate: m.cancellationRate, noShowRate: m.noShowRate,
  };
}

export type OccupancyForecastDto = {
  id: string; restaurantId: string; date: string; timeSlot: string;
  predictedOccupancyRate: number; predictedRevenue: number;
  confidence: string;
};

export function toOccupancyForecastDto(f: OccupancyForecast): OccupancyForecastDto {
  return {
    id: f.id, restaurantId: f.restaurantId, date: f.date, timeSlot: f.timeSlot,
    predictedOccupancyRate: f.predictedOccupancyRate,
    predictedRevenue: f.predictedRevenue, confidence: f.confidence,
  };
}

export type RecommendationDto = {
  id: string; restaurantId: string; type: string; priority: string;
  status: string; title: string; estimatedRevenueImpact: number;
  difficulty: string;
};

export function toRecommendationDto(r: OptimizationRecommendation): RecommendationDto {
  return {
    id: r.id, restaurantId: r.restaurantId, type: r.type, priority: r.priority,
    status: r.status, title: r.title,
    estimatedRevenueImpact: r.estimatedRevenueImpact, difficulty: r.difficulty,
  };
}
