import type { IntegrationContext, ExecutionStatus } from "../models/IntegrationContext.js";

export interface IntegrationContextRepository {
  save(context: IntegrationContext): Promise<void>;
  findById(id: string): Promise<IntegrationContext | null>;
  findByIntegration(integrationId: string): Promise<IntegrationContext[]>;
  findByRestaurant(restaurantId: string): Promise<IntegrationContext[]>;
  findByStatus(restaurantId: string, status: ExecutionStatus): Promise<IntegrationContext[]>;
  findLatestByIntegration(integrationId: string): Promise<IntegrationContext | null>;
  delete(id: string): Promise<void>;
}
