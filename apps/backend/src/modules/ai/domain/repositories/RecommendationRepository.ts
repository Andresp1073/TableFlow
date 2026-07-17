import type { Recommendation, RecommendationType, RecommendationStatus } from "../models/Recommendation.js";

export interface RecommendationRepository {
  save(recommendation: Recommendation): Promise<void>;
  findById(id: string): Promise<Recommendation | null>;
  findByRestaurant(restaurantId: string): Promise<Recommendation[]>;
  findByType(restaurantId: string, type: RecommendationType): Promise<Recommendation[]>;
  findByStatus(restaurantId: string, status: RecommendationStatus): Promise<Recommendation[]>;
  findActive(restaurantId: string): Promise<Recommendation[]>;
  delete(id: string): Promise<void>;
}
