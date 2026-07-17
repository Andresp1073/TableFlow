import type { IntegrationHealth, HealthStatus, HealthCheck } from "../../domain/models/IntegrationHealth.js";

export interface IntegrationHealthDto {
  id: string;
  integrationId: string;
  restaurantId: string;
  status: HealthStatus;
  responseTimeMs: number;
  lastCheckedAt: string;
  message: string | null;
  checks: HealthCheck[];
  isOnline: boolean;
}

export function toIntegrationHealthDto(health: IntegrationHealth): IntegrationHealthDto {
  return {
    id: health.id,
    integrationId: health.integrationId,
    restaurantId: health.restaurantId,
    status: health.status,
    responseTimeMs: health.responseTimeMs,
    lastCheckedAt: health.lastCheckedAt.toISOString(),
    message: health.message ?? null,
    checks: health.checks.map((c) => ({ ...c })),
    isOnline: health.isOnline,
  };
}
