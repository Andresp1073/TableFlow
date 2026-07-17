import type { IntegrationHealthRepository } from "../repositories/IntegrationHealthRepository.js";
import type { ConnectionProfileRepository } from "../repositories/ConnectionProfileRepository.js";
import { IntegrationHealth, type HealthStatus, type HealthCheck } from "../models/IntegrationHealth.js";
import type { IntegrationProviderAdapter } from "./IntegrationProviderAdapter.js";

export class HealthMonitor {
  constructor(
    private readonly healthRepo: IntegrationHealthRepository,
    private readonly profileRepo: ConnectionProfileRepository,
  ) {}

  async checkHealth(
    integrationId: string,
    profileId: string,
    restaurantId: string,
    adapter: IntegrationProviderAdapter,
  ): Promise<IntegrationHealth> {
    const profile = await this.profileRepo.findById(profileId);
    if (!profile) throw new Error(`Connection profile not found: ${profileId}`);

    const healthResult = await adapter.checkHealth(profile);

    const checks: HealthCheck[] = [
      { name: "connectivity", status: healthResult.isOnline ? "healthy" : "unhealthy", responseTimeMs: healthResult.responseTimeMs, message: healthResult.message },
      { name: "authentication", status: "healthy", responseTimeMs: 0 },
    ];

    const status: HealthStatus = healthResult.isOnline ? "healthy" : "unhealthy";

    const health = IntegrationHealth.create({
      id: crypto.randomUUID(),
      integrationId,
      restaurantId,
      status,
      responseTimeMs: healthResult.responseTimeMs,
      message: healthResult.message,
      details: { adapterType: adapter.providerType },
      checks,
      isOnline: healthResult.isOnline,
    });

    await this.healthRepo.save(health);

    const updatedProfile = profile.recordHealthCheck();
    await this.profileRepo.save(updatedProfile);

    return health;
  }

  async getLatestHealth(integrationId: string): Promise<IntegrationHealth | null> {
    return this.healthRepo.findLatestByIntegration(integrationId);
  }

  async getHealthHistory(integrationId: string): Promise<IntegrationHealth[]> {
    return this.healthRepo.findByIntegration(integrationId);
  }

  async getUnhealthyIntegrations(restaurantId: string): Promise<IntegrationHealth[]> {
    return this.healthRepo.findUnhealthy(restaurantId);
  }

  async recordHealth(
    integrationId: string,
    restaurantId: string,
    status: HealthStatus,
    responseTimeMs: number,
    checks: HealthCheck[],
    isOnline: boolean,
    message?: string,
  ): Promise<IntegrationHealth> {
    const health = IntegrationHealth.create({
      id: crypto.randomUUID(),
      integrationId,
      restaurantId,
      status,
      responseTimeMs,
      message,
      details: {},
      checks,
      isOnline,
    });
    await this.healthRepo.save(health);
    return health;
  }
}
