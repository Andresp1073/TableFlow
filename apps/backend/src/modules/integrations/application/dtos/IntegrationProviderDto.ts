import type { IntegrationProvider, ProviderStatus } from "../../domain/models/IntegrationProvider.js";
import type { IntegrationType } from "../../domain/models/IntegrationDefinition.js";

export interface IntegrationProviderDto {
  id: string;
  name: string;
  type: IntegrationType;
  version: string;
  description: string | null;
  baseUrl: string | null;
  docsUrl: string | null;
  status: ProviderStatus;
  supportedCapabilities: string[];
  authTypes: string[];
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export function toIntegrationProviderDto(provider: IntegrationProvider): IntegrationProviderDto {
  return {
    id: provider.id,
    name: provider.name,
    type: provider.type,
    version: provider.version,
    description: provider.description ?? null,
    baseUrl: provider.baseUrl ?? null,
    docsUrl: provider.docsUrl ?? null,
    status: provider.status,
    supportedCapabilities: [...provider.supportedCapabilities],
    authTypes: [...provider.authTypes],
    isActive: provider.isActive,
    priority: provider.priority,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  };
}
