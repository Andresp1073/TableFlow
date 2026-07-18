import type { DemandSnapshotRepository } from "../../domain/repositories/DemandSnapshotRepository.js";
import type { RevenueStrategyRepository } from "../../domain/repositories/RevenueStrategyRepository.js";
import type { CapacityRepository } from "../../domain/repositories/CapacityRepository.js";
import type { RevenueAnalyticsRepository } from "../../domain/repositories/RevenueAnalyticsRepository.js";
import { DemandAnalyzer } from "../../domain/services/DemandAnalyzer.js";
import { CapacityAnalyzer } from "../../domain/services/CapacityAnalyzer.js";
import { PricingEngine } from "../../domain/services/PricingEngine.js";
import { ForecastService } from "../../domain/services/ForecastService.js";
import { OptimizationEngine } from "../../domain/services/OptimizationEngine.js";
import type { DemandSnapshot, DemandSummary } from "../../domain/models/DemandSnapshot.js";
import type { RestaurantCapacity } from "../../domain/models/RestaurantCapacity.js";
import type { PricingRule } from "../../domain/models/PricingRule.js";
import type { RevenueStrategy } from "../../domain/models/RevenueStrategy.js";
import type { OccupancyForecast } from "../../domain/models/OccupancyForecast.js";
import type { RevenueMetric } from "../../domain/models/RevenueMetric.js";
import type { OptimizationRecommendation } from "../../domain/models/OptimizationRecommendation.js";
import { DemandAnalyzed } from "../../domain/events/DemandAnalyzed.js";
import { RevenueOpportunityDetected } from "../../domain/events/RevenueOpportunityDetected.js";
import { ForecastGenerated } from "../../domain/events/ForecastGenerated.js";
import { OptimizationRecommended } from "../../domain/events/OptimizationRecommended.js";
import { PricingRuleCreated } from "../../domain/events/PricingRuleCreated.js";

export class RevenueManager {
  private readonly demandAnalyzer: DemandAnalyzer;
  private readonly capacityAnalyzer: CapacityAnalyzer;
  private readonly pricingEngine: PricingEngine;
  private readonly forecastService: ForecastService;
  private readonly optimizationEngine: OptimizationEngine;
  readonly events: unknown[] = [];

  constructor(
    private readonly demandRepo: DemandSnapshotRepository,
    private readonly strategyRepo: RevenueStrategyRepository,
    private readonly capacityRepo: CapacityRepository,
    private readonly analyticsRepo: RevenueAnalyticsRepository,
  ) {
    this.demandAnalyzer = new DemandAnalyzer();
    this.capacityAnalyzer = new CapacityAnalyzer();
    this.pricingEngine = new PricingEngine();
    this.forecastService = new ForecastService();
    this.optimizationEngine = new OptimizationEngine();
  }

  async recordDemand(snapshot: DemandSnapshot): Promise<void> {
    await this.demandRepo.save(snapshot);
    this.events.push(new DemandAnalyzed(
      snapshot.id, snapshot.restaurantId, snapshot.date,
      snapshot.timeSlot, snapshot.occupancyRate,
      snapshot.totalDemand(), snapshot.unservedDemand(),
    ));
  }

  async analyzeDemand(restaurantId: string): Promise<{ summary: DemandSummary; opportunities: Array<{ timeSlot: string; currentOccupancy: number; potentialCovers: number }> }> {
    const snapshots = await this.demandRepo.findByRestaurant(restaurantId);
    const capacity = await this.capacityRepo.findByRestaurant(restaurantId);
    if (!capacity) throw new Error("Restaurant capacity not configured");

    const result = this.demandAnalyzer.analyze(snapshots, capacity);

    for (const opp of result.opportunities) {
      this.events.push(new RevenueOpportunityDetected(
        restaurantId, opp.timeSlot, "", "low_occupancy",
        opp.potentialCovers * 20, opp.currentOccupancy,
        `Promote ${opp.timeSlot} slot - ${opp.potentialCovers} potential covers`,
      ));
    }

    return { summary: result.summary, opportunities: result.opportunities };
  }

  async analyzeCapacity(restaurantId: string): Promise<ReturnType<typeof this.capacityAnalyzer.analyze>> {
    const capacity = await this.capacityRepo.findByRestaurant(restaurantId);
    if (!capacity) throw new Error("Restaurant capacity not configured");

    const snapshots = await this.demandRepo.findByRestaurant(restaurantId);
    const currentOcc = snapshots.length > 0
      ? snapshots[snapshots.length - 1]!.occupancyRate : 0;

    return this.capacityAnalyzer.analyze(capacity, currentOcc);
  }

  async createPricingRule(rule: PricingRule): Promise<PricingRule> {
    await this.strategyRepo.savePricingRule(rule);
    this.events.push(new PricingRuleCreated(
      rule.id, rule.restaurantId, rule.name,
      rule.conditions as Record<string, unknown>,
      rule.priceMultiplier, rule.priority,
    ));
    return rule;
  }

  async calculatePrice(config: {
    restaurantId: string; basePrice: number; occupancyRate: number;
    partySize: number; dayOfWeek: number; timeSlot: string;
  }): Promise<{ price: number; appliedRule: PricingRule | null }> {
    const rules = await this.strategyRepo.findApplicableRules(
      config.restaurantId, config.timeSlot, config.dayOfWeek,
    );
    const result = this.pricingEngine.calculatePrice(
      config.basePrice, rules, config.occupancyRate,
      config.partySize, config.dayOfWeek, config.timeSlot,
    );

    if (result.appliedRule) {
      const updated = result.appliedRule.recordApplication();
      await this.strategyRepo.savePricingRule(updated);
    }

    return result;
  }

  async generateForecast(restaurantId: string, date: string, timeSlot: string): Promise<OccupancyForecast> {
    const snapshots = await this.demandRepo.findByRestaurant(restaurantId);
    const capacity = await this.capacityRepo.findByRestaurant(restaurantId);
    if (!capacity) throw new Error("Restaurant capacity not configured");

    const forecast = this.forecastService.generateOccupancyForecast(snapshots, capacity, date, timeSlot);
    await this.analyticsRepo.saveForecast(forecast);

    this.events.push(new ForecastGenerated(
      forecast.id, restaurantId, date, timeSlot,
      forecast.predictedOccupancyRate, forecast.predictedRevenue,
      forecast.confidence,
    ));

    return forecast;
  }

  async generateRecommendations(restaurantId: string): Promise<OptimizationRecommendation[]> {
    const snapshots = await this.demandRepo.findByRestaurant(restaurantId);
    const capacity = await this.capacityRepo.findByRestaurant(restaurantId);
    if (!capacity) throw new Error("Restaurant capacity not configured");

    const recommendations = this.optimizationEngine.generateRecommendations(snapshots, capacity);

    for (const rec of recommendations) {
      await this.analyticsRepo.saveRecommendation(rec);
      this.events.push(new OptimizationRecommended(
        rec.id, restaurantId, rec.type, rec.priority, rec.title, rec.estimatedRevenueImpact,
      ));
    }

    return recommendations;
  }

  async getMetrics(restaurantId: string, fromDate: string, toDate: string): Promise<RevenueMetric[]> {
    return this.analyticsRepo.findMetricsByDateRange(restaurantId, fromDate, toDate);
  }

  async getStrategies(restaurantId: string): Promise<RevenueStrategy[]> {
    return this.strategyRepo.findByRestaurant(restaurantId);
  }

  getDemandAnalyzer(): DemandAnalyzer { return this.demandAnalyzer; }
  getCapacityAnalyzer(): CapacityAnalyzer { return this.capacityAnalyzer; }
  getPricingEngine(): PricingEngine { return this.pricingEngine; }
  getForecastService(): ForecastService { return this.forecastService; }
  getOptimizationEngine(): OptimizationEngine { return this.optimizationEngine; }
}
