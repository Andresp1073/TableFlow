import type {
  DeploymentStrategyType,
  DeploymentStrategyConfig,
  RollingUpdateConfig,
  BlueGreenConfig,
  CanaryConfig,
  RecreateConfig,
  DeploymentResult,
} from "./types.js";
import { DEPLOYMENT_STRATEGY_TYPES } from "./types.js";
import { OrchestrationValidationError } from "./errors.js";

export interface DeploymentStrategy {
  readonly type: DeploymentStrategyType;
  readonly name: string;
  readonly description: string;
  execute(name: string, replicas: number, config: DeploymentStrategyConfig): Promise<DeploymentResult>;
  validate(config: DeploymentStrategyConfig): string[];
}

export class RollingUpdateStrategy implements DeploymentStrategy {
  readonly type: DeploymentStrategyType = "rolling_update";
  readonly name = "Rolling Update";
  readonly description = "Gradually replaces pods with new ones without downtime";

  async execute(name: string, replicas: number, _config: DeploymentStrategyConfig): Promise<DeploymentResult> {
    const now = new Date();
    return {
      id: `${name}-rolling-${Date.now()}`,
      name,
      status: "healthy",
      strategy: "rolling_update",
      replicas,
      availableReplicas: replicas,
      readyReplicas: replicas,
      updatedReplicas: replicas,
      startedAt: now,
      completedAt: new Date(),
      durationMs: 30_000,
      metadata: { strategy: "rolling_update", maxUnavailable: _config.rollingUpdate?.maxUnavailable ?? "25%", maxSurge: _config.rollingUpdate?.maxSurge ?? "25%" },
    };
  }

  validate(config: DeploymentStrategyConfig): string[] {
    const errors: string[] = [];
    if (!config.rollingUpdate) {
      errors.push("Rolling update strategy requires rollingUpdate config");
    }
    return errors;
  }
}

export class BlueGreenStrategy implements DeploymentStrategy {
  readonly type: DeploymentStrategyType = "blue_green";
  readonly name = "Blue/Green";
  readonly description = "Creates a new environment (green) alongside the old one (blue), then switches traffic";

  async execute(name: string, replicas: number, _config: DeploymentStrategyConfig): Promise<DeploymentResult> {
    const now = new Date();
    return {
      id: `${name}-bluegreen-${Date.now()}`,
      name,
      status: "healthy",
      strategy: "blue_green",
      replicas,
      availableReplicas: replicas,
      readyReplicas: replicas,
      updatedReplicas: replicas,
      startedAt: now,
      completedAt: new Date(),
      durationMs: 60_000,
      metadata: {
        strategy: "blue_green",
        previewService: _config.blueGreen?.previewServiceName,
        activeService: _config.blueGreen?.activeServiceName,
        autoPromote: _config.blueGreen?.autoPromote,
      },
    };
  }

  validate(config: DeploymentStrategyConfig): string[] {
    const errors: string[] = [];
    if (!config.blueGreen) {
      errors.push("Blue/green strategy requires blueGreen config");
    } else {
      if (!config.blueGreen.previewServiceName) {
        errors.push("Blue/green requires previewServiceName");
      }
      if (!config.blueGreen.activeServiceName) {
        errors.push("Blue/green requires activeServiceName");
      }
    }
    return errors;
  }
}

export class CanaryStrategy implements DeploymentStrategy {
  readonly type: DeploymentStrategyType = "canary";
  readonly name = "Canary";
  readonly description = "Rolls out changes to a small subset of users before full deployment";

  async execute(name: string, replicas: number, _config: DeploymentStrategyConfig): Promise<DeploymentResult> {
    const now = new Date();
    const steps = _config.canary?.steps ?? [];
    return {
      id: `${name}-canary-${Date.now()}`,
      name,
      status: "healthy",
      strategy: "canary",
      replicas,
      availableReplicas: replicas,
      readyReplicas: replicas,
      updatedReplicas: replicas,
      startedAt: now,
      completedAt: new Date(),
      durationMs: 120_000,
      metadata: {
        strategy: "canary",
        steps: steps.map((s) => ({ weight: s.weight, pauseMs: s.pauseMs })),
        trafficMirroring: _config.canary?.trafficMirroring,
      },
    };
  }

  validate(config: DeploymentStrategyConfig): string[] {
    const errors: string[] = [];
    if (!config.canary) {
      errors.push("Canary strategy requires canary config");
    } else {
      if (!config.canary.steps || config.canary.steps.length === 0) {
        errors.push("Canary requires at least one step");
      }
      const totalWeight = config.canary.steps.reduce((sum, step) => sum + step.weight, 0);
      if (totalWeight > 100) {
        errors.push("Canary step weights exceed 100");
      }
    }
    return errors;
  }
}

export class RecreateStrategy implements DeploymentStrategy {
  readonly type: DeploymentStrategyType = "recreate";
  readonly name = "Recreate";
  readonly description = "Terminates all pods before creating new ones (downtime expected)";

  async execute(name: string, replicas: number, _config: DeploymentStrategyConfig): Promise<DeploymentResult> {
    const now = new Date();
    return {
      id: `${name}-recreate-${Date.now()}`,
      name,
      status: "healthy",
      strategy: "recreate",
      replicas,
      availableReplicas: replicas,
      readyReplicas: replicas,
      updatedReplicas: replicas,
      startedAt: now,
      completedAt: new Date(),
      durationMs: 15_000,
      metadata: {
        strategy: "recreate",
        maxShutdownTimeMs: _config.recreate?.maxShutdownTimeMs,
      },
    };
  }

  validate(config: DeploymentStrategyConfig): string[] {
    const errors: string[] = [];
    if (!config.recreate) {
      errors.push("Recreate strategy requires recreate config");
    }
    return errors;
  }
}

export class DeploymentStrategyFactory {
  private static readonly strategies: Map<DeploymentStrategyType, DeploymentStrategy> = new Map([
    ["rolling_update", new RollingUpdateStrategy()],
    ["blue_green", new BlueGreenStrategy()],
    ["canary", new CanaryStrategy()],
    ["recreate", new RecreateStrategy()],
  ]);

  static getStrategy(type: DeploymentStrategyType): DeploymentStrategy {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new OrchestrationValidationError(`Unknown deployment strategy: ${type}`, []);
    }
    return strategy;
  }

  static registerCustomStrategy(type: DeploymentStrategyType, strategy: DeploymentStrategy): void {
    if (this.strategies.has(type) && DEPLOYMENT_STRATEGY_TYPES.includes(type)) {
      throw new OrchestrationValidationError(`Cannot override built-in strategy: ${type}`, []);
    }
    this.strategies.set(type, strategy);
  }

  static listStrategies(): DeploymentStrategy[] {
    return Array.from(this.strategies.values());
  }
}
