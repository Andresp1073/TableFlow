import type { Recommendation, RecommendationType, RecommendationPriority, RecommendationStatus } from "../../domain/models/Recommendation.js";

export interface RecommendationDto {
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
  expiresAt: string | null;
  appliedAt: string | null;
  dismissedAt: string | null;
  dismissedReason: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function toRecommendationDto(recommendation: Recommendation): RecommendationDto {
  return {
    id: recommendation.id,
    restaurantId: recommendation.restaurantId,
    type: recommendation.type,
    status: recommendation.status,
    priority: recommendation.priority,
    title: recommendation.title,
    description: recommendation.description,
    reasoning: recommendation.reasoning,
    expectedImpact: recommendation.expectedImpact,
    confidence: recommendation.confidence,
    source: recommendation.source,
    expiresAt: recommendation.expiresAt?.toISOString() ?? null,
    appliedAt: recommendation.appliedAt?.toISOString() ?? null,
    dismissedAt: recommendation.dismissedAt?.toISOString() ?? null,
    dismissedReason: recommendation.dismissedReason ?? null,
    createdBy: recommendation.createdBy,
    createdAt: recommendation.createdAt.toISOString(),
    updatedAt: recommendation.updatedAt.toISOString(),
  };
}
