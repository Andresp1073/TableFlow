import type { IntegrationDefinitionRepository } from "../repositories/IntegrationDefinitionRepository.js";
import type { IntegrationContextRepository } from "../repositories/IntegrationContextRepository.js";
import type { ConnectionProfileRepository } from "../repositories/ConnectionProfileRepository.js";
import { IntegrationContext } from "../models/IntegrationContext.js";
import type { IntegrationDefinition } from "../models/IntegrationDefinition.js";
import type { ConnectionProfile } from "../models/ConnectionProfile.js";
import type { IntegrationProviderAdapter, ProviderExecutionResult } from "./IntegrationProviderAdapter.js";
import { SynchronizationRequested } from "../events/SynchronizationRequested.js";
import { SynchronizationCompleted } from "../events/SynchronizationCompleted.js";
import {
  ERPAdapter, CRMAdapter, POSAdapter, AccountingAdapter,
  PaymentsAdapter, MarketingAdapter, MessagingAdapter,
  AnalyticsAdapter, IdentityAdapter, CustomAdapter,
} from "./IntegrationProviderAdapter.js";

export class IntegrationOrchestrator {
  readonly events: unknown[] = [];
  private readonly adapters = new Map<string, IntegrationProviderAdapter>();

  constructor(
    private readonly definitionRepo: IntegrationDefinitionRepository,
    private readonly contextRepo: IntegrationContextRepository,
    private readonly profileRepo: ConnectionProfileRepository,
  ) {
    this.registerDefaultAdapters();
  }

  private registerDefaultAdapters(): void {
    const adapters: IntegrationProviderAdapter[] = [
      new ERPAdapter(), new CRMAdapter(), new POSAdapter(),
      new AccountingAdapter(), new PaymentsAdapter(), new MarketingAdapter(),
      new MessagingAdapter(), new AnalyticsAdapter(), new IdentityAdapter(),
      new CustomAdapter(),
    ];
    for (const adapter of adapters) {
      this.registerAdapter(adapter);
    }
  }

  registerAdapter(adapter: IntegrationProviderAdapter): void {
    this.adapters.set(adapter.providerType, adapter);
  }

  getAdapter(providerType: string): IntegrationProviderAdapter | undefined {
    return this.adapters.get(providerType);
  }

  listAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  async execute(
    definition: IntegrationDefinition,
    capability: string,
    payload: Record<string, unknown>,
    mode: "sync" | "async" = "sync",
  ): Promise<IntegrationContext> {
    const adapter = this.adapters.get(definition.type);
    if (!adapter) throw new Error(`No adapter for integration type: ${definition.type}`);

    const profile = await this.profileRepo.findActiveByIntegration(definition.id);
    if (!profile) throw new Error(`No active connection for integration: ${definition.id}`);
    if (!profile.isConnected()) throw new Error(`Connection is not active for integration: ${definition.id}`);

    const context = IntegrationContext.create({
      id: crypto.randomUUID(),
      integrationId: definition.id,
      restaurantId: definition.restaurantId,
      mode,
      capability,
      payload,
    });

    await this.contextRepo.save(context);

    this.events.push(new SynchronizationRequested(
      definition.id, definition.restaurantId, context.id, capability,
    ));

    const started = context.start();
    await this.contextRepo.save(started);

    try {
      const result = await adapter.execute(started, definition, profile);
      const completed = this.buildCompletedContext(started, result);
      await this.contextRepo.save(completed);

      const updatedDef = definition.markRun();
      await this.definitionRepo.save(updatedDef);

      this.events.push(new SynchronizationCompleted(
        definition.id, definition.restaurantId, completed.id, capability,
        result.success, result.recordsProcessed, result.processingTimeMs,
      ));

      return completed;
    } catch (error) {
      const failed = started.fail(error instanceof Error ? error.message : String(error));
      await this.contextRepo.save(failed);

      this.events.push(new SynchronizationCompleted(
        definition.id, definition.restaurantId, failed.id, capability,
        false, 0, 0,
      ));

      return failed;
    }
  }

  private buildCompletedContext(context: IntegrationContext, result: ProviderExecutionResult): IntegrationContext {
    return context.complete({
      ...result.data,
      recordsProcessed: result.recordsProcessed,
      processingTimeMs: result.processingTimeMs,
      success: result.success,
    });
  }

  async getContext(contextId: string): Promise<IntegrationContext | null> {
    return this.contextRepo.findById(contextId);
  }

  async getContextsByIntegration(integrationId: string): Promise<IntegrationContext[]> {
    return this.contextRepo.findByIntegration(integrationId);
  }
}
