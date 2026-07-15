import type { DemandSnapshotRepository } from "../../domain/repositories/DemandSnapshotRepository.js";
import type { RevenueStrategyRepository } from "../../domain/repositories/RevenueStrategyRepository.js";
import type { CapacityRepository } from "../../domain/repositories/CapacityRepository.js";
import type { RevenueAnalyticsRepository } from "../../domain/repositories/RevenueAnalyticsRepository.js";
import type { DemandSnapshot } from "../../domain/models/DemandSnapshot.js";
import type { RevenueStrategy } from "../../domain/models/RevenueStrategy.js";
import type { PricingRule } from "../../domain/models/PricingRule.js";
import type { RestaurantCapacity } from "../../domain/models/RestaurantCapacity.js";
import type { OccupancyForecast } from "../../domain/models/OccupancyForecast.js";
import type { RevenueMetric } from "../../domain/models/RevenueMetric.js";
import type { OptimizationRecommendation } from "../../domain/models/OptimizationRecommendation.js";

export class InMemoryDemandSnapshotRepository implements DemandSnapshotRepository {
  private readonly snapshots: Map<string, DemandSnapshot> = new Map();

  async findById(id: string): Promise<DemandSnapshot | null> {
    return this.snapshots.get(id) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<DemandSnapshot[]> {
    return Array.from(this.snapshots.values()).filter((s) => s.restaurantId === restaurantId)
      .sort((a, b) => a.date.localeCompare(b.date) || a.timeSlot.localeCompare(b.timeSlot));
  }

  async findByDateRange(restaurantId: string, fromDate: string, toDate: string): Promise<DemandSnapshot[]> {
    return Array.from(this.snapshots.values()).filter(
      (s) => s.restaurantId === restaurantId && s.date >= fromDate && s.date <= toDate,
    ).sort((a, b) => a.date.localeCompare(b.date));
  }

  async findByTimeSlot(restaurantId: string, timeSlot: string): Promise<DemandSnapshot[]> {
    return Array.from(this.snapshots.values()).filter(
      (s) => s.restaurantId === restaurantId && s.timeSlot === timeSlot,
    );
  }

  async findByDateAndSlot(restaurantId: string, date: string, timeSlot: string): Promise<DemandSnapshot | null> {
    for (const s of this.snapshots.values()) {
      if (s.restaurantId === restaurantId && s.date === date && s.timeSlot === timeSlot) return s;
    }
    return null;
  }

  async save(snapshot: DemandSnapshot): Promise<void> {
    this.snapshots.set(snapshot.id, snapshot);
  }

  async delete(id: string): Promise<void> {
    this.snapshots.delete(id);
  }
}

export class InMemoryRevenueStrategyRepository implements RevenueStrategyRepository {
  private readonly strategies: Map<string, RevenueStrategy> = new Map();
  private readonly pricingRules: Map<string, PricingRule> = new Map();

  async findById(id: string): Promise<RevenueStrategy | null> {
    return this.strategies.get(id) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<RevenueStrategy[]> {
    return Array.from(this.strategies.values()).filter((s) => s.restaurantId === restaurantId);
  }

  async findActiveByRestaurant(restaurantId: string): Promise<RevenueStrategy[]> {
    return Array.from(this.strategies.values()).filter(
      (s) => s.restaurantId === restaurantId && s.isCurrentlyValid(),
    );
  }

  async findByType(restaurantId: string, type: string): Promise<RevenueStrategy[]> {
    return Array.from(this.strategies.values()).filter(
      (s) => s.restaurantId === restaurantId && s.type === type,
    );
  }

  async save(strategy: RevenueStrategy): Promise<void> {
    this.strategies.set(strategy.id, strategy);
  }

  async delete(id: string): Promise<void> {
    this.strategies.delete(id);
  }

  async findPricingRuleById(id: string): Promise<PricingRule | null> {
    return this.pricingRules.get(id) ?? null;
  }

  async findPricingRulesByRestaurant(restaurantId: string): Promise<PricingRule[]> {
    return Array.from(this.pricingRules.values()).filter((r) => r.restaurantId === restaurantId);
  }

  async findApplicableRules(restaurantId: string, timeSlot: string, dayOfWeek: number): Promise<PricingRule[]> {
    return Array.from(this.pricingRules.values()).filter(
      (r) => r.restaurantId === restaurantId && r.isActive,
    );
  }

  async savePricingRule(rule: PricingRule): Promise<void> {
    this.pricingRules.set(rule.id, rule);
  }

  async deletePricingRule(id: string): Promise<void> {
    this.pricingRules.delete(id);
  }
}

export class InMemoryCapacityRepository implements CapacityRepository {
  private readonly capacities: Map<string, RestaurantCapacity> = new Map();

  async findById(id: string): Promise<RestaurantCapacity | null> {
    return this.capacities.get(id) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<RestaurantCapacity | null> {
    for (const c of this.capacities.values()) {
      if (c.restaurantId === restaurantId) return c;
    }
    return null;
  }

  async save(capacity: RestaurantCapacity): Promise<void> {
    this.capacities.set(capacity.id, capacity);
  }

  async delete(id: string): Promise<void> {
    this.capacities.delete(id);
  }
}

export class InMemoryRevenueAnalyticsRepository implements RevenueAnalyticsRepository {
  private readonly forecasts: Map<string, OccupancyForecast> = new Map();
  private readonly metrics: Map<string, RevenueMetric> = new Map();
  private readonly recommendations: Map<string, OptimizationRecommendation> = new Map();

  async findForecastById(id: string): Promise<OccupancyForecast | null> {
    return this.forecasts.get(id) ?? null;
  }

  async findForecastsByRestaurant(restaurantId: string): Promise<OccupancyForecast[]> {
    return Array.from(this.forecasts.values()).filter((f) => f.restaurantId === restaurantId);
  }

  async findForecastsByDate(restaurantId: string, date: string): Promise<OccupancyForecast[]> {
    return Array.from(this.forecasts.values()).filter((f) => f.restaurantId === restaurantId && f.date === date);
  }

  async saveForecast(forecast: OccupancyForecast): Promise<void> {
    this.forecasts.set(forecast.id, forecast);
  }

  async deleteForecast(id: string): Promise<void> {
    this.forecasts.delete(id);
  }

  async findMetricById(id: string): Promise<RevenueMetric | null> {
    return this.metrics.get(id) ?? null;
  }

  async findMetricsByRestaurant(restaurantId: string): Promise<RevenueMetric[]> {
    return Array.from(this.metrics.values()).filter((m) => m.restaurantId === restaurantId);
  }

  async findMetricsByDateRange(restaurantId: string, fromDate: string, toDate: string): Promise<RevenueMetric[]> {
    return Array.from(this.metrics.values()).filter(
      (m) => m.restaurantId === restaurantId && m.date >= fromDate && m.date <= toDate,
    );
  }

  async saveMetric(metric: RevenueMetric): Promise<void> {
    this.metrics.set(metric.id, metric);
  }

  async findRecommendationById(id: string): Promise<OptimizationRecommendation | null> {
    return this.recommendations.get(id) ?? null;
  }

  async findRecommendationsByRestaurant(restaurantId: string, status?: string): Promise<OptimizationRecommendation[]> {
    return Array.from(this.recommendations.values()).filter(
      (r) => r.restaurantId === restaurantId && (status === undefined || r.status === status),
    );
  }

  async saveRecommendation(recommendation: OptimizationRecommendation): Promise<void> {
    this.recommendations.set(recommendation.id, recommendation);
  }
}
