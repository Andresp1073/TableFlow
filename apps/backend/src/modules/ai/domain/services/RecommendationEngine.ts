import { Recommendation, type RecommendationType, type RecommendationPriority, type RecommendationStatus } from "../models/Recommendation.js";

export interface RecommendationParams {
  restaurantId: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: string;
  confidence: number;
  source: string;
  data: Record<string, unknown>;
  createdBy: string;
  expiresAt?: Date;
}

export interface RecommendationStrategy {
  readonly type: RecommendationType;
  generate(params: RecommendationParams): Recommendation;
}

export class TableAllocationStrategy implements RecommendationStrategy {
  readonly type: RecommendationType = "table_allocation";

  generate(params: RecommendationParams): Recommendation {
    return this.createRecommendation(params);
  }

  private createRecommendation(params: RecommendationParams): Recommendation {
    return Recommendation.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      type: params.type,
      priority: params.priority,
      title: params.title,
      description: params.description,
      reasoning: params.reasoning,
      expectedImpact: params.expectedImpact,
      confidence: params.confidence,
      source: params.source,
      expiresAt: params.expiresAt,
      createdBy: params.createdBy,
      metadata: params.data,
    });
  }
}

export class PricingStrategy implements RecommendationStrategy {
  readonly type: RecommendationType = "pricing";

  generate(params: RecommendationParams): Recommendation {
    return Recommendation.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      type: params.type,
      priority: params.priority,
      title: params.title,
      description: params.description,
      reasoning: params.reasoning,
      expectedImpact: params.expectedImpact,
      confidence: params.confidence,
      source: params.source,
      expiresAt: params.expiresAt,
      createdBy: params.createdBy,
      metadata: params.data,
    });
  }
}

export class InventoryPurchasingStrategy implements RecommendationStrategy {
  readonly type: RecommendationType = "inventory_purchasing";

  generate(params: RecommendationParams): Recommendation {
    return Recommendation.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      type: params.type,
      priority: params.priority,
      title: params.title,
      description: params.description,
      reasoning: params.reasoning,
      expectedImpact: params.expectedImpact,
      confidence: params.confidence,
      source: params.source,
      expiresAt: params.expiresAt,
      createdBy: params.createdBy,
      metadata: params.data,
    });
  }
}

export class CustomerOfferStrategy implements RecommendationStrategy {
  readonly type: RecommendationType = "customer_offer";

  generate(params: RecommendationParams): Recommendation {
    return Recommendation.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      type: params.type,
      priority: params.priority,
      title: params.title,
      description: params.description,
      reasoning: params.reasoning,
      expectedImpact: params.expectedImpact,
      confidence: params.confidence,
      source: params.source,
      expiresAt: params.expiresAt,
      createdBy: params.createdBy,
      metadata: params.data,
    });
  }
}

export class MenuOptimizationStrategy implements RecommendationStrategy {
  readonly type: RecommendationType = "menu_optimization";

  generate(params: RecommendationParams): Recommendation {
    return Recommendation.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      type: params.type,
      priority: params.priority,
      title: params.title,
      description: params.description,
      reasoning: params.reasoning,
      expectedImpact: params.expectedImpact,
      confidence: params.confidence,
      source: params.source,
      expiresAt: params.expiresAt,
      createdBy: params.createdBy,
      metadata: params.data,
    });
  }
}

export class StaffPlanningStrategy implements RecommendationStrategy {
  readonly type: RecommendationType = "staff_planning";

  generate(params: RecommendationParams): Recommendation {
    return Recommendation.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      type: params.type,
      priority: params.priority,
      title: params.title,
      description: params.description,
      reasoning: params.reasoning,
      expectedImpact: params.expectedImpact,
      confidence: params.confidence,
      source: params.source,
      expiresAt: params.expiresAt,
      createdBy: params.createdBy,
      metadata: params.data,
    });
  }
}

export class RecommendationEngine {
  private readonly strategies = new Map<RecommendationType, RecommendationStrategy>();

  constructor() {
    this.register(new TableAllocationStrategy());
    this.register(new PricingStrategy());
    this.register(new InventoryPurchasingStrategy());
    this.register(new CustomerOfferStrategy());
    this.register(new MenuOptimizationStrategy());
    this.register(new StaffPlanningStrategy());
  }

  register(strategy: RecommendationStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  hasStrategy(type: RecommendationType): boolean {
    return this.strategies.has(type);
  }

  listTypes(): RecommendationType[] {
    return Array.from(this.strategies.keys());
  }

  generate(params: RecommendationParams): Recommendation {
    const strategy = this.strategies.get(params.type);
    if (!strategy) throw new Error(`No recommendation strategy for type: ${params.type}`);
    return strategy.generate(params);
  }

  generateAll(params: Omit<RecommendationParams, "type">): Recommendation[] {
    return Array.from(this.strategies.values()).map((strategy) =>
      strategy.generate({ ...params, type: strategy.type }),
    );
  }
}
