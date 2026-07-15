import type {
  DeploymentDefinitionConfig,
  DeploymentResult,
  ScalingResult,
  ScalingStrategyType,
  DeploymentStatus,
  OrchestrationProvider,
  OrchestrationProviderType,
} from "./types.js";
import { DeploymentDefinition } from "./DeploymentDefinition.js";
import { DeploymentStrategyFactory } from "./DeploymentStrategy.js";
import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";
import { publishOrchestrationEvent } from "./events.js";
import { OrchestrationNotFoundError, OrchestrationValidationError } from "./errors.js";
import { generateEventId } from "../event-bus/EventMetadata.js";

export class DeploymentManager {
  private readonly providers: Map<OrchestrationProviderType, OrchestrationProvider> = new Map();
  private readonly deployments: Map<string, DeploymentResult> = new Map();
  private readonly logger?: Logger;
  private readonly eventPublisher?: EventPublisher;
  private readonly defaultNamespace: string;

  constructor(options?: {
    logger?: Logger;
    eventPublisher?: EventPublisher;
    defaultNamespace?: string;
  }) {
    this.logger = options?.logger;
    this.eventPublisher = options?.eventPublisher;
    this.defaultNamespace = options?.defaultNamespace ?? "default";
  }

  registerProvider(provider: OrchestrationProvider): void {
    this.providers.set(provider.providerType, provider);
  }

  getProvider(providerType: OrchestrationProviderType): OrchestrationProvider | undefined {
    return this.providers.get(providerType);
  }

  async deploy(config: DeploymentDefinitionConfig): Promise<DeploymentResult> {
    const definition = new DeploymentDefinition(config);
    const strategy = DeploymentStrategyFactory.getStrategy(config.strategy.type);

    const validationErrors = strategy.validate(config.strategy);
    if (validationErrors.length > 0) {
      throw new OrchestrationValidationError(
        `Strategy validation failed: ${validationErrors.join("; ")}`,
        validationErrors,
      );
    }

    await publishOrchestrationEvent(
      this.eventPublisher,
      this.logger,
      "deployment.started",
      config.name,
      { strategy: config.strategy.type, replicas: config.replicas },
    );

    try {
      const result = await strategy.execute(config.name, config.replicas, config.strategy);
      const deploymentResult: DeploymentResult = {
        ...result,
        id: generateEventId(),
      };

      this.deployments.set(config.name, deploymentResult);

      await publishOrchestrationEvent(
        this.eventPublisher,
        this.logger,
        "deployment.completed",
        config.name,
        { status: deploymentResult.status, durationMs: deploymentResult.durationMs },
      );

      return deploymentResult;
    } catch (error) {
      const failedResult: DeploymentResult = {
        id: generateEventId(),
        name: config.name,
        status: "failed",
        strategy: config.strategy.type,
        replicas: config.replicas,
        availableReplicas: 0,
        readyReplicas: 0,
        updatedReplicas: 0,
        startedAt: new Date(),
        completedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metadata: {},
      };

      this.deployments.set(config.name, failedResult);

      await publishOrchestrationEvent(
        this.eventPublisher,
        this.logger,
        "deployment.failed",
        config.name,
        { error: failedResult.error },
      );

      return failedResult;
    }
  }

  async scale(
    name: string,
    replicas: number,
    _strategy?: ScalingStrategyType,
  ): Promise<ScalingResult> {
    const existing = this.deployments.get(name);
    if (!existing) {
      throw new OrchestrationNotFoundError("deployment", name);
    }

    const previousReplicas = existing.replicas;
    const now = new Date();

    await publishOrchestrationEvent(
      this.eventPublisher,
      this.logger,
      "scaling.triggered",
      name,
      { previousReplicas, newReplicas: replicas },
    );

    const updatedResult: DeploymentResult = {
      ...existing,
      replicas,
      updatedReplicas: replicas,
    };
    this.deployments.set(name, updatedResult);

    const scalingResult: ScalingResult = {
      policyName: name,
      strategy: _strategy ?? "horizontal",
      previousReplicas,
      newReplicas: replicas,
      status: "healthy",
      triggeredAt: now,
      completedAt: new Date(),
      metadata: {},
    };

    await publishOrchestrationEvent(
      this.eventPublisher,
      this.logger,
      "scaling.completed",
      name,
      { previousReplicas, newReplicas: replicas },
    );

    return scalingResult;
  }

  async rollback(name: string, revision?: string): Promise<DeploymentResult> {
    const existing = this.deployments.get(name);
    if (!existing) {
      throw new OrchestrationNotFoundError("deployment", name);
    }

    const rolledBack: DeploymentResult = {
      ...existing,
      status: "rolled_back",
      completedAt: new Date(),
      metadata: {
        ...existing.metadata,
        rolledBackFrom: revision ?? "previous",
      },
    };

    this.deployments.set(name, rolledBack);

    await publishOrchestrationEvent(
      this.eventPublisher,
      this.logger,
      "deployment.rolled_back",
      name,
      { revision: revision ?? "previous" },
    );

    return rolledBack;
  }

  async getStatus(name: string): Promise<DeploymentResult> {
    const result = this.deployments.get(name);
    if (!result) {
      throw new OrchestrationNotFoundError("deployment", name);
    }
    return result;
  }

  async delete(name: string): Promise<void> {
    if (!this.deployments.has(name)) {
      throw new OrchestrationNotFoundError("deployment", name);
    }
    this.deployments.delete(name);
  }

  async list(): Promise<DeploymentResult[]> {
    return Array.from(this.deployments.values());
  }
}


