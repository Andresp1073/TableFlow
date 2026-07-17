import type { IntegrationAdapter } from "../models/IntegrationAdapter.js";
import type { CapabilityType } from "../models/IntegrationDefinition.js";

export interface IntegrationAdapterRepository {
  save(adapter: IntegrationAdapter): Promise<void>;
  findById(id: string): Promise<IntegrationAdapter | null>;
  findByProvider(providerId: string): Promise<IntegrationAdapter[]>;
  findByCapability(capability: CapabilityType): Promise<IntegrationAdapter[]>;
  findActive(): Promise<IntegrationAdapter[]>;
  delete(id: string): Promise<void>;
}
