import type { IntegrationProvider } from "../models/IntegrationProvider.js";
import type { IntegrationType } from "../models/IntegrationDefinition.js";

export interface IntegrationProviderRepository {
  save(provider: IntegrationProvider): Promise<void>;
  findById(id: string): Promise<IntegrationProvider | null>;
  findByType(type: IntegrationType): Promise<IntegrationProvider[]>;
  findActive(): Promise<IntegrationProvider[]>;
  findActiveByType(type: IntegrationType): Promise<IntegrationProvider[]>;
  delete(id: string): Promise<void>;
}
