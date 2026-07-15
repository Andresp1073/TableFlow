import type { OccupancyForecast } from "../models/OccupancyForecast.js";
import type { RevenueMetric } from "../models/RevenueMetric.js";
import type { OptimizationRecommendation } from "../models/OptimizationRecommendation.js";

export interface RevenueAnalyticsRepository {
  findForecastById(id: string): Promise<OccupancyForecast | null>;
  findForecastsByRestaurant(restaurantId: string): Promise<OccupancyForecast[]>;
  findForecastsByDate(restaurantId: string, date: string): Promise<OccupancyForecast[]>;
  saveForecast(forecast: OccupancyForecast): Promise<void>;
  deleteForecast(id: string): Promise<void>;

  findMetricById(id: string): Promise<RevenueMetric | null>;
  findMetricsByRestaurant(restaurantId: string): Promise<RevenueMetric[]>;
  findMetricsByDateRange(restaurantId: string, fromDate: string, toDate: string): Promise<RevenueMetric[]>;
  saveMetric(metric: RevenueMetric): Promise<void>;

  findRecommendationById(id: string): Promise<OptimizationRecommendation | null>;
  findRecommendationsByRestaurant(restaurantId: string, status?: string): Promise<OptimizationRecommendation[]>;
  saveRecommendation(recommendation: OptimizationRecommendation): Promise<void>;
}
