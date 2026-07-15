import type { RevenueStrategy } from "../models/RevenueStrategy.js";
import type { PricingRule } from "../models/PricingRule.js";

export interface RevenueStrategyRepository {
  findById(id: string): Promise<RevenueStrategy | null>;
  findByRestaurant(restaurantId: string): Promise<RevenueStrategy[]>;
  findActiveByRestaurant(restaurantId: string): Promise<RevenueStrategy[]>;
  findByType(restaurantId: string, type: string): Promise<RevenueStrategy[]>;
  save(strategy: RevenueStrategy): Promise<void>;
  delete(id: string): Promise<void>;

  findPricingRuleById(id: string): Promise<PricingRule | null>;
  findPricingRulesByRestaurant(restaurantId: string): Promise<PricingRule[]>;
  findApplicableRules(restaurantId: string, timeSlot: string, dayOfWeek: number): Promise<PricingRule[]>;
  savePricingRule(rule: PricingRule): Promise<void>;
  deletePricingRule(id: string): Promise<void>;
}
