import type {
  DeploymentDefinitionConfig,
  DeploymentStrategyConfig,
  RuntimeProfileConfig,
  ScalingPolicyConfig,
  ServiceDefinitionConfig,
  NetworkPolicyDefinitionConfig,
  DeploymentStrategyType,
} from "./types.js";
import { DEPLOYMENT_STRATEGY_TYPES } from "./types.js";
import { OrchestrationValidationError } from "./errors.js";

export class DeploymentDefinition {
  readonly name: string;
  readonly namespace: string;
  readonly labels: Readonly<Record<string, string>>;
  readonly annotations: Readonly<Record<string, string>>;
  readonly replicas: number;
  readonly strategy: DeploymentStrategyConfig;
  readonly runtimeProfile: RuntimeProfileConfig;
  readonly scalingPolicy: ScalingPolicyConfig;
  readonly serviceDefinition?: ServiceDefinitionConfig;
  readonly networkPolicies: readonly NetworkPolicyDefinitionConfig[];
  readonly healthCheckPath?: string;
  readonly healthCheckPort?: number;
  readonly revisionHistoryLimit: number;
  readonly progressDeadlineSeconds: number;
  readonly minReadySeconds: number;
  readonly paused: boolean;

  constructor(config: DeploymentDefinitionConfig) {
    DeploymentDefinition.validate(config);

    this.name = config.name;
    this.namespace = config.namespace ?? "default";
    this.labels = Object.freeze({ ...config.labels });
    this.annotations = Object.freeze({ ...config.annotations });
    this.replicas = config.replicas;
    this.strategy = { ...config.strategy };
    this.runtimeProfile = { ...config.runtimeProfile };
    this.scalingPolicy = { ...config.scalingPolicy };
    this.serviceDefinition = config.serviceDefinition ? { ...config.serviceDefinition } : undefined;
    this.networkPolicies = Object.freeze([...(config.networkPolicies ?? [])]);
    this.healthCheckPath = config.healthCheckPath;
    this.healthCheckPort = config.healthCheckPort;
    this.revisionHistoryLimit = config.revisionHistoryLimit ?? 10;
    this.progressDeadlineSeconds = config.progressDeadlineSeconds ?? 600;
    this.minReadySeconds = config.minReadySeconds ?? 0;
    this.paused = config.paused;
  }

  private static validate(config: DeploymentDefinitionConfig): void {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push("Deployment name is required");
    }

    if (config.replicas < 0) {
      errors.push("Replicas must be non-negative");
    }

    if (!DEPLOYMENT_STRATEGY_TYPES.includes(config.strategy.type)) {
      errors.push(`Invalid deployment strategy: ${config.strategy.type}`);
    }

    if (config.strategy.type === "rolling_update" && !config.strategy.rollingUpdate) {
      errors.push("Rolling update strategy requires rollingUpdate config");
    }

    if (config.strategy.type === "blue_green" && !config.strategy.blueGreen) {
      errors.push("Blue/green strategy requires blueGreen config");
    }

    if (config.strategy.type === "canary" && !config.strategy.canary) {
      errors.push("Canary strategy requires canary config");
    }

    if (config.strategy.type === "recreate" && !config.strategy.recreate) {
      errors.push("Recreate strategy requires recreate config");
    }

    if (config.scalingPolicy.minReplicas > config.scalingPolicy.maxReplicas) {
      errors.push("Min replicas cannot exceed max replicas");
    }

    if (config.scalingPolicy.minReplicas < 0) {
      errors.push("Min replicas must be non-negative");
    }

    if (errors.length > 0) {
      throw new OrchestrationValidationError("Invalid deployment definition", errors);
    }
  }

  toConfig(): DeploymentDefinitionConfig {
    return {
      name: this.name,
      namespace: this.namespace,
      labels: { ...this.labels },
      annotations: { ...this.annotations },
      replicas: this.replicas,
      strategy: { ...this.strategy },
      runtimeProfile: { ...this.runtimeProfile },
      scalingPolicy: { ...this.scalingPolicy },
      serviceDefinition: this.serviceDefinition ? { ...this.serviceDefinition } : undefined,
      networkPolicies: [...this.networkPolicies],
      healthCheckPath: this.healthCheckPath,
      healthCheckPort: this.healthCheckPort,
      revisionHistoryLimit: this.revisionHistoryLimit,
      progressDeadlineSeconds: this.progressDeadlineSeconds,
      minReadySeconds: this.minReadySeconds,
      paused: this.paused,
    };
  }
}
