import type { AIRequest, AIRequestStatus } from "../models/AIRequest.js";

export interface AIRequestRepository {
  save(request: AIRequest): Promise<void>;
  findById(id: string): Promise<AIRequest | null>;
  findByRestaurant(restaurantId: string): Promise<AIRequest[]>;
  findByStatus(restaurantId: string, status: AIRequestStatus): Promise<AIRequest[]>;
  findByProvider(restaurantId: string, provider: string): Promise<AIRequest[]>;
  delete(id: string): Promise<void>;
}
