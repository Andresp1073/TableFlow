export enum RecommendationType {
  IncreaseAvailability = "increase_availability",
  AdjustPricing = "adjust_pricing",
  PromoteLowDemand = "promote_low_demand",
  OptimizeTableAllocation = "optimize_table_allocation",
  ReduceEmptyCapacity = "reduce_empty_capacity",
  ExtendHours = "extend_hours",
  ModifyPartySizePolicy = "modify_party_size_policy",
}

export enum RecommendationPriority {
  Critical = "critical",
  High = "high",
  Medium = "medium",
  Low = "low",
}

export enum RecommendationStatus {
  Pending = "pending",
  Applied = "applied",
  Dismissed = "dismissed",
}

export interface OptimizationRecommendationConfig {
  id: string;
  restaurantId: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  title: string;
  description: string;
  estimatedRevenueImpact: number;
  estimatedCostImpact: number;
  difficulty: string;
  suggestedActions: string[];
  relevantTimeSlots: string[];
  relevantDates: string[];
  metrics: Record<string, number>;
  generatedAt: Date;
  appliedAt: Date | null;
  dismissedAt: Date | null;
  dismissedReason: string | null;
}

export class OptimizationRecommendation {
  private constructor(public readonly data: OptimizationRecommendationConfig) {}

  static create(config: Omit<OptimizationRecommendationConfig, "status" | "generatedAt" | "appliedAt" | "dismissedAt" | "dismissedReason">): OptimizationRecommendation {
    return new OptimizationRecommendation({
      ...config, status: RecommendationStatus.Pending, generatedAt: new Date(),
      appliedAt: null, dismissedAt: null, dismissedReason: null,
    });
  }

  static reconstitute(config: OptimizationRecommendationConfig): OptimizationRecommendation {
    return new OptimizationRecommendation(config);
  }

  get id(): string { return this.data.id; }
  get restaurantId(): string { return this.data.restaurantId; }
  get type(): RecommendationType { return this.data.type; }
  get priority(): RecommendationPriority { return this.data.priority; }
  get status(): RecommendationStatus { return this.data.status; }
  get title(): string { return this.data.title; }
  get description(): string { return this.data.description; }
  get estimatedRevenueImpact(): number { return this.data.estimatedRevenueImpact; }
  get estimatedCostImpact(): number { return this.data.estimatedCostImpact; }
  get difficulty(): string { return this.data.difficulty; }
  get suggestedActions(): readonly string[] { return this.data.suggestedActions; }
  get relevantTimeSlots(): readonly string[] { return this.data.relevantTimeSlots; }
  get relevantDates(): readonly string[] { return this.data.relevantDates; }
  get metrics(): Record<string, number> { return this.data.metrics; }
  get generatedAt(): Date { return this.data.generatedAt; }
  get appliedAt(): Date | null { return this.data.appliedAt; }
  get dismissedAt(): Date | null { return this.data.dismissedAt; }
  get dismissedReason(): string | null { return this.data.dismissedReason; }

  equals(other: OptimizationRecommendation): boolean { return this.data.id === other.data.id; }

  netImpact(): number { return this.data.estimatedRevenueImpact - this.data.estimatedCostImpact; }

  apply(): OptimizationRecommendation {
    return OptimizationRecommendation.reconstitute({ ...this.data, status: RecommendationStatus.Applied, appliedAt: new Date() });
  }

  dismiss(reason: string): OptimizationRecommendation {
    return OptimizationRecommendation.reconstitute({
      ...this.data, status: RecommendationStatus.Dismissed, dismissedAt: new Date(), dismissedReason: reason,
    });
  }
}
