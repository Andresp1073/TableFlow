import type { IntegrationContext, ExecutionMode, ExecutionStatus } from "../../domain/models/IntegrationContext.js";

export interface IntegrationContextDto {
  id: string;
  integrationId: string;
  restaurantId: string;
  mode: ExecutionMode;
  status: ExecutionStatus;
  capability: string;
  progress: number;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export function toIntegrationContextDto(context: IntegrationContext): IntegrationContextDto {
  return {
    id: context.id,
    integrationId: context.integrationId,
    restaurantId: context.restaurantId,
    mode: context.mode,
    status: context.status,
    capability: context.capability,
    progress: context.progress,
    error: context.error ?? null,
    startedAt: context.startedAt?.toISOString() ?? null,
    completedAt: context.completedAt?.toISOString() ?? null,
    createdAt: context.createdAt.toISOString(),
  };
}
