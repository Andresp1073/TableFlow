import type { IntegrationDefinitionRepository } from "../../domain/repositories/IntegrationDefinitionRepository.js";
import type { ConnectionProfileRepository } from "../../domain/repositories/ConnectionProfileRepository.js";
import type { IntegrationProviderRepository } from "../../domain/repositories/IntegrationProviderRepository.js";
import type { IntegrationAdapterRepository } from "../../domain/repositories/IntegrationAdapterRepository.js";
import type { IntegrationContextRepository } from "../../domain/repositories/IntegrationContextRepository.js";
import type { IntegrationHealthRepository } from "../../domain/repositories/IntegrationHealthRepository.js";
import { IntegrationManager } from "../../domain/services/IntegrationManager.js";
import { IntegrationProvider } from "../../domain/models/IntegrationProvider.js";
import { IntegrationAdapter } from "../../domain/models/IntegrationAdapter.js";
import type { IntegrationType, CapabilityType, IntegrationCapabilityData } from "../../domain/models/IntegrationDefinition.js";
import type { AuthType } from "../../domain/models/ConnectionProfile.js";
import type { HealthStatus, HealthCheck } from "../../domain/models/IntegrationHealth.js";
import type { IntegrationProviderAdapter } from "../../domain/services/IntegrationProviderAdapter.js";
import { toIntegrationDefinitionDto, type IntegrationDefinitionDto } from "../dtos/IntegrationDefinitionDto.js";
import { toConnectionProfileDto, type ConnectionProfileDto } from "../dtos/ConnectionProfileDto.js";
import { toIntegrationProviderDto, type IntegrationProviderDto } from "../dtos/IntegrationProviderDto.js";
import { toIntegrationAdapterDto, type IntegrationAdapterDto } from "../dtos/IntegrationAdapterDto.js";
import { toIntegrationContextDto, type IntegrationContextDto } from "../dtos/IntegrationContextDto.js";
import { toIntegrationHealthDto, type IntegrationHealthDto } from "../dtos/IntegrationHealthDto.js";

export class IntegrationApplicationService {
  private readonly manager: IntegrationManager;

  constructor(
    definitionRepo: IntegrationDefinitionRepository,
    profileRepo: ConnectionProfileRepository,
    providerRepo: IntegrationProviderRepository,
    adapterRepo: IntegrationAdapterRepository,
    contextRepo: IntegrationContextRepository,
    healthRepo: IntegrationHealthRepository,
  ) {
    this.manager = new IntegrationManager(
      definitionRepo, profileRepo, providerRepo, adapterRepo, contextRepo, healthRepo,
    );
  }

  getManager(): IntegrationManager {
    return this.manager;
  }

  async createIntegration(
    restaurantId: string,
    name: string,
    type: IntegrationType,
    providerId: string,
    config: Record<string, unknown>,
    tags: string[],
    createdBy: string,
  ): Promise<IntegrationDefinitionDto> {
    const definition = await this.manager.createIntegration({
      id: crypto.randomUUID(),
      restaurantId,
      name,
      type,
      providerId,
      config,
      tags,
      createdBy,
    });
    return toIntegrationDefinitionDto(definition);
  }

  async configureIntegration(
    integrationId: string,
    adapterId: string,
    capabilities: IntegrationCapabilityData[],
    config: Record<string, unknown>,
  ): Promise<IntegrationDefinitionDto> {
    const definition = await this.manager.configureIntegration(integrationId, adapterId, capabilities, config);
    return toIntegrationDefinitionDto(definition);
  }

  async archiveIntegration(integrationId: string): Promise<IntegrationDefinitionDto> {
    const definition = await this.manager.archiveIntegration(integrationId);
    return toIntegrationDefinitionDto(definition);
  }

  async getIntegration(integrationId: string): Promise<IntegrationDefinitionDto | null> {
    const definition = await this.manager.getIntegration(integrationId);
    return definition ? toIntegrationDefinitionDto(definition) : null;
  }

  async getIntegrations(restaurantId: string): Promise<IntegrationDefinitionDto[]> {
    const definitions = await this.manager.getIntegrations(restaurantId);
    return definitions.map(toIntegrationDefinitionDto);
  }

  async getActiveIntegrations(restaurantId: string): Promise<IntegrationDefinitionDto[]> {
    const definitions = await this.manager.getActiveIntegrations(restaurantId);
    return definitions.map(toIntegrationDefinitionDto);
  }

  async createConnection(
    integrationId: string,
    restaurantId: string,
    name: string,
    authType: AuthType,
    credentialsRef: string,
    baseUrl?: string,
  ): Promise<ConnectionProfileDto> {
    const profile = await this.manager.connectionManager.createConnection({
      integrationId, restaurantId, name, authType, credentialsRef, baseUrl,
    });
    return toConnectionProfileDto(profile);
  }

  async connectProfile(profileId: string): Promise<ConnectionProfileDto> {
    const profile = await this.manager.connectionManager.connect(profileId);
    return toConnectionProfileDto(profile);
  }

  async disconnectProfile(profileId: string, reason?: string): Promise<ConnectionProfileDto> {
    const profile = await this.manager.connectionManager.disconnect(profileId, reason);
    return toConnectionProfileDto(profile);
  }

  async getProfilesByIntegration(integrationId: string): Promise<ConnectionProfileDto[]> {
    const profiles = await this.manager.connectionManager.getProfilesByIntegration(integrationId);
    return profiles.map(toConnectionProfileDto);
  }

  async checkIntegrationHealth(
    integrationId: string,
    profileId: string,
    restaurantId: string,
    adapter: IntegrationProviderAdapter,
  ): Promise<IntegrationHealthDto> {
    const health = await this.manager.healthMonitor.checkHealth(integrationId, profileId, restaurantId, adapter);
    return toIntegrationHealthDto(health);
  }

  async getLatestHealth(integrationId: string): Promise<IntegrationHealthDto | null> {
    const health = await this.manager.healthMonitor.getLatestHealth(integrationId);
    return health ? toIntegrationHealthDto(health) : null;
  }

  async getUnhealthyIntegrations(restaurantId: string): Promise<IntegrationHealthDto[]> {
    const records = await this.manager.healthMonitor.getUnhealthyIntegrations(restaurantId);
    return records.map(toIntegrationHealthDto);
  }

  async executeIntegration(
    integrationId: string,
    capability: string,
    payload: Record<string, unknown>,
    mode: "sync" | "async" = "sync",
  ): Promise<IntegrationContextDto> {
    const context = await this.manager.executeIntegration(integrationId, capability, payload, mode);
    return toIntegrationContextDto(context);
  }

  async getContexts(integrationId: string): Promise<IntegrationContextDto[]> {
    const contexts = await this.manager.getContexts(integrationId);
    return contexts.map(toIntegrationContextDto);
  }

  async registerProvider(
    id: string,
    name: string,
    type: IntegrationType,
    version: string,
    supportedCapabilities: string[],
    authTypes: string[],
    priority: number,
    description?: string,
    baseUrl?: string,
    docsUrl?: string,
  ): Promise<void> {
    const provider = IntegrationProvider.create({
      id, name, type, version, description, baseUrl, docsUrl,
      status: "active", supportedCapabilities, configSchema: {},
      authTypes, priority,
    });
    await this.manager.registerProvider(provider);
  }

  async registerAdapter(
    id: string,
    providerId: string,
    name: string,
    version: string,
    supportedCapabilities: CapabilityType[],
    description?: string,
  ): Promise<void> {
    const adapter = IntegrationAdapter.create({
      id, providerId, name, version, description,
      status: "active", supportedCapabilities, config: {},
    });
    await this.manager.registerAdapter(adapter);
  }

  listRegisteredProviders(): IntegrationProviderDto[] {
    return this.manager.listProviders().map(toIntegrationProviderDto);
  }

  listRegisteredAdapters(): IntegrationAdapterDto[] {
    return this.manager.listAdapters().map(toIntegrationAdapterDto);
  }
}
