import type { IntegrationHealth } from "../models/IntegrationHealth.js";

export interface IntegrationHealthRepository {
  save(health: IntegrationHealth): Promise<void>;
  findById(id: string): Promise<IntegrationHealth | null>;
  findByIntegration(integrationId: string): Promise<IntegrationHealth[]>;
  findByRestaurant(restaurantId: string): Promise<IntegrationHealth[]>;
  findLatestByIntegration(integrationId: string): Promise<IntegrationHealth | null>;
  findUnhealthy(restaurantId: string): Promise<IntegrationHealth[]>;
  delete(id: string): Promise<void>;
}
