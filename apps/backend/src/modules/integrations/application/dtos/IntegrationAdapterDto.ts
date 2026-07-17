import type { IntegrationAdapter, AdapterStatus } from "../../domain/models/IntegrationAdapter.js";
import type { CapabilityType } from "../../domain/models/IntegrationDefinition.js";

export interface IntegrationAdapterDto {
  id: string;
  providerId: string;
  name: string;
  version: string;
  description: string | null;
  status: AdapterStatus;
  supportedCapabilities: CapabilityType[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toIntegrationAdapterDto(adapter: IntegrationAdapter): IntegrationAdapterDto {
  return {
    id: adapter.id,
    providerId: adapter.providerId,
    name: adapter.name,
    version: adapter.version,
    description: adapter.description ?? null,
    status: adapter.status,
    supportedCapabilities: [...adapter.supportedCapabilities],
    isActive: adapter.isActive,
    createdAt: adapter.createdAt.toISOString(),
    updatedAt: adapter.updatedAt.toISOString(),
  };
}
