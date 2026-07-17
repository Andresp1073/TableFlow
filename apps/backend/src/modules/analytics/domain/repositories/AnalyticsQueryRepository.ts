import type { AnalyticsQuery } from "../models/AnalyticsQuery.js";

export interface AnalyticsQueryRepository {
  save(query: AnalyticsQuery): Promise<void>;
  findById(id: string): Promise<AnalyticsQuery | null>;
  findByRestaurant(restaurantId: string): Promise<AnalyticsQuery[]>;
  delete(id: string): Promise<void>;
}
