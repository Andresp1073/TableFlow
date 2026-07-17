import type { IntegrationDefinitionRepository } from "../../domain/repositories/IntegrationDefinitionRepository.js";
import type { ConnectionProfileRepository } from "../../domain/repositories/ConnectionProfileRepository.js";
import type { IntegrationProviderRepository } from "../../domain/repositories/IntegrationProviderRepository.js";
import type { IntegrationAdapterRepository } from "../../domain/repositories/IntegrationAdapterRepository.js";
import type { IntegrationContextRepository } from "../../domain/repositories/IntegrationContextRepository.js";
import type { IntegrationHealthRepository } from "../../domain/repositories/IntegrationHealthRepository.js";
import type { IntegrationDefinition, IntegrationType, IntegrationStatus } from "../../domain/models/IntegrationDefinition.js";
import type { ConnectionProfile, ConnectionStatus } from "../../domain/models/ConnectionProfile.js";
import type { IntegrationProvider } from "../../domain/models/IntegrationProvider.js";
import type { IntegrationAdapter } from "../../domain/models/IntegrationAdapter.js";
import type { CapabilityType } from "../../domain/models/IntegrationDefinition.js";
import type { IntegrationContext, ExecutionStatus } from "../../domain/models/IntegrationContext.js";
import type { IntegrationHealth } from "../../domain/models/IntegrationHealth.js";

export class InMemoryIntegrationDefinitionRepository implements IntegrationDefinitionRepository {
  private readonly definitions = new Map<string, IntegrationDefinition>();

  async save(definition: IntegrationDefinition): Promise<void> {
    this.definitions.set(definition.id, definition);
  }

  async findById(id: string): Promise<IntegrationDefinition | null> {
    return this.definitions.get(id) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<IntegrationDefinition[]> {
    return Array.from(this.definitions.values()).filter((d) => d.restaurantId === restaurantId);
  }

  async findByType(restaurantId: string, type: IntegrationType): Promise<IntegrationDefinition[]> {
    return Array.from(this.definitions.values()).filter(
      (d) => d.restaurantId === restaurantId && d.type === type,
    );
  }

  async findByStatus(restaurantId: string, status: IntegrationStatus): Promise<IntegrationDefinition[]> {
    return Array.from(this.definitions.values()).filter(
      (d) => d.restaurantId === restaurantId && d.status === status,
    );
  }

  async findActive(restaurantId: string): Promise<IntegrationDefinition[]> {
    return Array.from(this.definitions.values()).filter(
      (d) => d.restaurantId === restaurantId && d.isActive && d.status !== "archived",
    );
  }

  async delete(id: string): Promise<void> {
    this.definitions.delete(id);
  }

  clear(): void {
    this.definitions.clear();
  }
}

export class InMemoryConnectionProfileRepository implements ConnectionProfileRepository {
  private readonly profiles = new Map<string, ConnectionProfile>();

  async save(profile: ConnectionProfile): Promise<void> {
    this.profiles.set(profile.id, profile);
  }

  async findById(id: string): Promise<ConnectionProfile | null> {
    return this.profiles.get(id) ?? null;
  }

  async findByIntegration(integrationId: string): Promise<ConnectionProfile[]> {
    return Array.from(this.profiles.values()).filter((p) => p.integrationId === integrationId);
  }

  async findByRestaurant(restaurantId: string): Promise<ConnectionProfile[]> {
    return Array.from(this.profiles.values()).filter((p) => p.restaurantId === restaurantId);
  }

  async findByStatus(restaurantId: string, status: ConnectionStatus): Promise<ConnectionProfile[]> {
    return Array.from(this.profiles.values()).filter(
      (p) => p.restaurantId === restaurantId && p.status === status,
    );
  }

  async findActiveByIntegration(integrationId: string): Promise<ConnectionProfile | null> {
    return Array.from(this.profiles.values()).find(
      (p) => p.integrationId === integrationId && p.isConnected(),
    ) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.profiles.delete(id);
  }

  clear(): void {
    this.profiles.clear();
  }
}

export class InMemoryIntegrationProviderRepository implements IntegrationProviderRepository {
  private readonly providers = new Map<string, IntegrationProvider>();

  async save(provider: IntegrationProvider): Promise<void> {
    this.providers.set(provider.id, provider);
  }

  async findById(id: string): Promise<IntegrationProvider | null> {
    return this.providers.get(id) ?? null;
  }

  async findByType(type: IntegrationType): Promise<IntegrationProvider[]> {
    return Array.from(this.providers.values()).filter((p) => p.type === type);
  }

  async findActive(): Promise<IntegrationProvider[]> {
    return Array.from(this.providers.values()).filter((p) => p.isActive);
  }

  async findActiveByType(type: IntegrationType): Promise<IntegrationProvider[]> {
    return Array.from(this.providers.values()).filter((p) => p.isActive && p.type === type);
  }

  async delete(id: string): Promise<void> {
    this.providers.delete(id);
  }

  clear(): void {
    this.providers.clear();
  }
}

export class InMemoryIntegrationAdapterRepository implements IntegrationAdapterRepository {
  private readonly adapters = new Map<string, IntegrationAdapter>();

  async save(adapter: IntegrationAdapter): Promise<void> {
    this.adapters.set(adapter.id, adapter);
  }

  async findById(id: string): Promise<IntegrationAdapter | null> {
    return this.adapters.get(id) ?? null;
  }

  async findByProvider(providerId: string): Promise<IntegrationAdapter[]> {
    return Array.from(this.adapters.values()).filter((a) => a.providerId === providerId);
  }

  async findByCapability(capability: CapabilityType): Promise<IntegrationAdapter[]> {
    return Array.from(this.adapters.values()).filter((a) => a.supportedCapabilities.includes(capability));
  }

  async findActive(): Promise<IntegrationAdapter[]> {
    return Array.from(this.adapters.values()).filter((a) => a.isActive);
  }

  async delete(id: string): Promise<void> {
    this.adapters.delete(id);
  }

  clear(): void {
    this.adapters.clear();
  }
}

export class InMemoryIntegrationContextRepository implements IntegrationContextRepository {
  private readonly contexts = new Map<string, IntegrationContext>();

  async save(context: IntegrationContext): Promise<void> {
    this.contexts.set(context.id, context);
  }

  async findById(id: string): Promise<IntegrationContext | null> {
    return this.contexts.get(id) ?? null;
  }

  async findByIntegration(integrationId: string): Promise<IntegrationContext[]> {
    return Array.from(this.contexts.values()).filter((c) => c.integrationId === integrationId);
  }

  async findByRestaurant(restaurantId: string): Promise<IntegrationContext[]> {
    return Array.from(this.contexts.values()).filter((c) => c.restaurantId === restaurantId);
  }

  async findByStatus(restaurantId: string, status: ExecutionStatus): Promise<IntegrationContext[]> {
    return Array.from(this.contexts.values()).filter(
      (c) => c.restaurantId === restaurantId && c.status === status,
    );
  }

  async findLatestByIntegration(integrationId: string): Promise<IntegrationContext | null> {
    const matches = Array.from(this.contexts.values())
      .filter((c) => c.integrationId === integrationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return matches[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    this.contexts.delete(id);
  }

  clear(): void {
    this.contexts.clear();
  }
}

export class InMemoryIntegrationHealthRepository implements IntegrationHealthRepository {
  private readonly healthRecords: IntegrationHealth[] = [];

  async save(health: IntegrationHealth): Promise<void> {
    this.healthRecords.push(health);
  }

  async findById(id: string): Promise<IntegrationHealth | null> {
    return this.healthRecords.find((h) => h.id === id) ?? null;
  }

  async findByIntegration(integrationId: string): Promise<IntegrationHealth[]> {
    return this.healthRecords.filter((h) => h.integrationId === integrationId);
  }

  async findByRestaurant(restaurantId: string): Promise<IntegrationHealth[]> {
    return this.healthRecords.filter((h) => h.restaurantId === restaurantId);
  }

  async findLatestByIntegration(integrationId: string): Promise<IntegrationHealth | null> {
    const matches = this.healthRecords
      .filter((h) => h.integrationId === integrationId)
      .sort((a, b) => b.lastCheckedAt.getTime() - a.lastCheckedAt.getTime());
    return matches[0] ?? null;
  }

  async findUnhealthy(restaurantId: string): Promise<IntegrationHealth[]> {
    return this.healthRecords.filter(
      (h) => h.restaurantId === restaurantId && !h.isHealthy(),
    );
  }

  async delete(id: string): Promise<void> {
    const index = this.healthRecords.findIndex((h) => h.id === id);
    if (index >= 0) this.healthRecords.splice(index, 1);
  }

  clear(): void {
    this.healthRecords.length = 0;
  }
}
