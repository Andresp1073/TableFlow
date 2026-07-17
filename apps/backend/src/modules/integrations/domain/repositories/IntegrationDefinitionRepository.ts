import type { IntegrationDefinition, IntegrationType, IntegrationStatus } from "../models/IntegrationDefinition.js";

export interface IntegrationDefinitionRepository {
  save(definition: IntegrationDefinition): Promise<void>;
  findById(id: string): Promise<IntegrationDefinition | null>;
  findByRestaurant(restaurantId: string): Promise<IntegrationDefinition[]>;
  findByType(restaurantId: string, type: IntegrationType): Promise<IntegrationDefinition[]>;
  findByStatus(restaurantId: string, status: IntegrationStatus): Promise<IntegrationDefinition[]>;
  findActive(restaurantId: string): Promise<IntegrationDefinition[]>;
  delete(id: string): Promise<void>;
}
