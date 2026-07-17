export type RecommendationType =
  | "table_allocation"
  | "pricing"
  | "inventory_purchasing"
  | "customer_offer"
  | "menu_optimization"
  | "staff_planning";

export type RecommendationPriority = "critical" | "high" | "medium" | "low";
export type RecommendationStatus = "draft" | "active" | "applied" | "dismissed" | "expired";

export interface RecommendationConfig {
  id: string;
  restaurantId: string;
  type: RecommendationType;
  status: RecommendationStatus;
  priority: RecommendationPriority;
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: string;
  confidence: number;
  source: string;
  expiresAt?: Date;
  appliedAt?: Date;
  dismissedAt?: Date;
  dismissedReason?: string;
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Recommendation {
  private constructor(private readonly config: RecommendationConfig) {}

  static create(config: Omit<RecommendationConfig, "status" | "createdAt" | "updatedAt">): Recommendation {
    const now = new Date();
    return new Recommendation({ ...config, status: "draft", createdAt: now, updatedAt: now });
  }

  static reconstitute(config: RecommendationConfig): Recommendation {
    return new Recommendation(config);
  }

  get id(): string { return this.config.id; }
  get restaurantId(): string { return this.config.restaurantId; }
  get type(): RecommendationType { return this.config.type; }
  get status(): RecommendationStatus { return this.config.status; }
  get priority(): RecommendationPriority { return this.config.priority; }
  get title(): string { return this.config.title; }
  get description(): string { return this.config.description; }
  get reasoning(): string { return this.config.reasoning; }
  get expectedImpact(): string { return this.config.expectedImpact; }
  get confidence(): number { return this.config.confidence; }
  get source(): string { return this.config.source; }
  get expiresAt(): Date | undefined { return this.config.expiresAt; }
  get appliedAt(): Date | undefined { return this.config.appliedAt; }
  get dismissedAt(): Date | undefined { return this.config.dismissedAt; }
  get dismissedReason(): string | undefined { return this.config.dismissedReason; }
  get createdBy(): string { return this.config.createdBy; }
  get createdAt(): Date { return this.config.createdAt; }
  get updatedAt(): Date { return this.config.updatedAt; }

  activate(): Recommendation {
    return Recommendation.reconstitute({ ...this.config, status: "active", updatedAt: new Date() });
  }

  apply(): Recommendation {
    return Recommendation.reconstitute({ ...this.config, status: "applied", appliedAt: new Date(), updatedAt: new Date() });
  }

  dismiss(reason: string): Recommendation {
    return Recommendation.reconstitute({
      ...this.config, status: "dismissed", dismissedAt: new Date(),
      dismissedReason: reason, updatedAt: new Date(),
    });
  }

  isExpired(): boolean {
    return !!this.config.expiresAt && this.config.expiresAt < new Date();
  }

  isActionable(): boolean {
    return this.config.status === "active" && !this.isExpired();
  }
}
