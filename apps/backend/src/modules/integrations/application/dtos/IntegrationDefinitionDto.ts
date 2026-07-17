import type { IntegrationDefinition, IntegrationType, IntegrationStatus, IntegrationCapabilityData } from "../../domain/models/IntegrationDefinition.js";

export interface IntegrationDefinitionDto {
  id: string;
  restaurantId: string;
  name: string;
  type: IntegrationType;
  status: IntegrationStatus;
  providerId: string;
  adapterId: string | null;
  capabilities: IntegrationCapabilityData[];
  version: number;
  isActive: boolean;
  tags: string[];
  errorMessage: string | null;
  lastRunAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function toIntegrationDefinitionDto(def: IntegrationDefinition): IntegrationDefinitionDto {
  return {
    id: def.id,
    restaurantId: def.restaurantId,
    name: def.name,
    type: def.type,
    status: def.status,
    providerId: def.providerId,
    adapterId: def.adapterId ?? null,
    capabilities: def.capabilities.map((c) => ({ ...c })),
    version: def.version,
    isActive: def.isActive,
    tags: [...def.tags],
    errorMessage: def.errorMessage ?? null,
    lastRunAt: def.lastRunAt?.toISOString() ?? null,
    createdBy: def.createdBy,
    createdAt: def.createdAt.toISOString(),
    updatedAt: def.updatedAt.toISOString(),
  };
}
