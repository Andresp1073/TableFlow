import type { IntegrationDefinitionRepository } from "../repositories/IntegrationDefinitionRepository.js";
import type { ConnectionProfileRepository } from "../repositories/ConnectionProfileRepository.js";
import type { IntegrationProviderRepository } from "../repositories/IntegrationProviderRepository.js";
import type { IntegrationAdapterRepository } from "../repositories/IntegrationAdapterRepository.js";
import type { IntegrationContextRepository } from "../repositories/IntegrationContextRepository.js";
import type { IntegrationHealthRepository } from "../repositories/IntegrationHealthRepository.js";
import { IntegrationDefinition, type IntegrationType, type CapabilityType, type IntegrationCapabilityData } from "../models/IntegrationDefinition.js";
import { IntegrationProvider } from "../models/IntegrationProvider.js";
import { IntegrationAdapter } from "../models/IntegrationAdapter.js";
import { ConnectionManager } from "./ConnectionManager.js";
import { HealthMonitor } from "./HealthMonitor.js";
import { IntegrationOrchestrator } from "./IntegrationOrchestrator.js";
import { IntegrationCreated } from "../events/IntegrationCreated.js";
import { type IntegrationProviderAdapter } from "./IntegrationProviderAdapter.js";

export class IntegrationManager {
  readonly connectionManager: ConnectionManager;
  readonly healthMonitor: HealthMonitor;
  readonly orchestrator: IntegrationOrchestrator;
  readonly events: unknown[] = [];

  private readonly providers = new Map<string, IntegrationProvider>();
  private readonly adapters = new Map<string, IntegrationAdapter>();

  constructor(
    readonly definitionRepo: IntegrationDefinitionRepository,
    readonly profileRepo: ConnectionProfileRepository,
    readonly providerRepo: IntegrationProviderRepository,
    readonly adapterRepo: IntegrationAdapterRepository,
    readonly contextRepo: IntegrationContextRepository,
    readonly healthRepo: IntegrationHealthRepository,
  ) {
    this.connectionManager = new ConnectionManager(profileRepo);
    this.healthMonitor = new HealthMonitor(healthRepo, profileRepo);
    this.orchestrator = new IntegrationOrchestrator(definitionRepo, contextRepo, profileRepo);
  }

  async createIntegration(config: {
    id: string;
    restaurantId: string;
    name: string;
    type: IntegrationType;
    providerId: string;
    config: Record<string, unknown>;
    tags: string[];
    createdBy: string;
  }): Promise<IntegrationDefinition> {
    const definition = IntegrationDefinition.create({
      id: config.id,
      restaurantId: config.restaurantId,
      name: config.name,
      type: config.type,
      providerId: config.providerId,
      config: config.config,
      tags: config.tags,
      createdBy: config.createdBy,
    });

    await this.definitionRepo.save(definition);

    this.events.push(new IntegrationCreated(
      definition.id, definition.restaurantId, definition.name, definition.type,
    ));

    return definition;
  }

  async configureIntegration(
    integrationId: string,
    adapterId: string,
    capabilities: IntegrationCapabilityData[],
    config: Record<string, unknown>,
  ): Promise<IntegrationDefinition> {
    const definition = await this.definitionRepo.findById(integrationId);
    if (!definition) throw new Error(`Integration not found: ${integrationId}`);

    const configured = definition.configure(adapterId, capabilities, config);
    await this.definitionRepo.save(configured);
    return configured;
  }

  async archiveIntegration(integrationId: string): Promise<IntegrationDefinition> {
    const definition = await this.definitionRepo.findById(integrationId);
    if (!definition) throw new Error(`Integration not found: ${integrationId}`);

    const archived = definition.archive();
    await this.definitionRepo.save(archived);
    return archived;
  }

  async registerProvider(provider: IntegrationProvider): Promise<void> {
    const existing = this.providers.get(provider.id);
    this.providers.set(provider.id, provider);
    if (!existing) {
      await this.providerRepo.save(provider);
    }
  }

  getProvider(id: string): IntegrationProvider | undefined {
    return this.providers.get(id);
  }

  listProviders(): IntegrationProvider[] {
    return Array.from(this.providers.values());
  }

  async registerAdapter(adapter: IntegrationAdapter): Promise<void> {
    this.adapters.set(adapter.id, adapter);
    await this.adapterRepo.save(adapter);
  }

  getAdapter(id: string): IntegrationAdapter | undefined {
    return this.adapters.get(id);
  }

  listAdapters(): IntegrationAdapter[] {
    return Array.from(this.adapters.values());
  }

  getProviderAdapter(providerType: string): IntegrationProviderAdapter | undefined {
    return this.orchestrator.getAdapter(providerType);
  }

  async getIntegration(integrationId: string): Promise<IntegrationDefinition | null> {
    return this.definitionRepo.findById(integrationId);
  }

  async getIntegrations(restaurantId: string): Promise<IntegrationDefinition[]> {
    return this.definitionRepo.findByRestaurant(restaurantId);
  }

  async getActiveIntegrations(restaurantId: string): Promise<IntegrationDefinition[]> {
    return this.definitionRepo.findActive(restaurantId);
  }

  async executeIntegration(
    integrationId: string,
    capability: string,
    payload: Record<string, unknown>,
    mode: "sync" | "async" = "sync",
  ): Promise<import("../models/IntegrationContext.js").IntegrationContext> {
    const definition = await this.definitionRepo.findById(integrationId);
    if (!definition) throw new Error(`Integration not found: ${integrationId}`);
    if (!definition.isRunnable()) throw new Error(`Integration is not runnable (status: ${definition.status})`);

    return this.orchestrator.execute(definition, capability, payload, mode);
  }

  async getContexts(integrationId: string): Promise<import("../models/IntegrationContext.js").IntegrationContext[]> {
    return this.orchestrator.getContextsByIntegration(integrationId);
  }
}
