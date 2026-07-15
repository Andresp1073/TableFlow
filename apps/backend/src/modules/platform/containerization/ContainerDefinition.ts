import type {
  ContainerDefinitionConfig,
  ContainerRuntimeConfig,
  PortMapping,
  VolumeMount,
  EnvironmentVariable,
  HealthCheckConfig,
  ContainerSecurityProfileConfig,
  ImageMetadataConfig,
  BuildStage,
  BuildStrategyType,
  ContainerRuntimeType,
  ContainerResources,
  ContainerLogging,
  ContainerSecret,
  RestartPolicy,
} from "./types.js";
import { BUILD_STRATEGY_TYPES, CONTAINER_RUNTIME_TYPES } from "./types.js";
import { ContainerValidationError } from "./errors.js";

export class ContainerDefinition {
  readonly name: string;
  readonly baseImage: string;
  readonly description: string;
  readonly ports: readonly PortMapping[];
  readonly volumes: readonly VolumeMount[];
  readonly environment: readonly EnvironmentVariable[];
  readonly healthChecks: readonly HealthCheckConfig[];
  readonly resources?: ContainerResources;
  readonly logging?: ContainerLogging;
  readonly secrets?: readonly ContainerSecret[];
  readonly restartPolicy: RestartPolicy;
  readonly securityProfile: ContainerSecurityProfileConfig;
  readonly buildStages: readonly BuildStage[];
  readonly buildStrategy: BuildStrategyType;
  readonly runtimeType: ContainerRuntimeType;
  readonly metadata: ImageMetadataConfig;

  constructor(config: ContainerDefinitionConfig) {
    ContainerDefinition.validate(config);

    this.name = config.name;
    this.baseImage = config.baseImage;
    this.description = config.description ?? "";
    this.ports = Object.freeze([...config.ports]);
    this.volumes = Object.freeze([...config.volumes]);
    this.environment = Object.freeze([...config.environment]);
    this.healthChecks = Object.freeze([...config.healthChecks]);
    this.resources = config.resources;
    this.logging = config.logging;
    this.secrets = config.secrets ? Object.freeze([...config.secrets]) : undefined;
    this.restartPolicy = config.restartPolicy ?? "unless_stopped";
    this.securityProfile = { ...config.securityProfile };
    this.buildStages = Object.freeze([...config.buildStages]);
    this.buildStrategy = config.buildStrategy;
    this.runtimeType = config.runtimeType;
    this.metadata = { ...config.metadata };
  }

  private static validate(config: ContainerDefinitionConfig): void {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push("Container name is required");
    }

    if (!config.baseImage || config.baseImage.trim().length === 0) {
      errors.push("Base image is required");
    }

    if (!BUILD_STRATEGY_TYPES.includes(config.buildStrategy)) {
      errors.push(`Invalid build strategy: ${config.buildStrategy}`);
    }

    if (!CONTAINER_RUNTIME_TYPES.includes(config.runtimeType)) {
      errors.push(`Invalid runtime type: ${config.runtimeType}`);
    }

    const portNumbers = new Set<number>();
    for (const port of config.ports) {
      if (port.containerPort <= 0 || port.containerPort > 65535) {
        errors.push(`Invalid container port: ${port.containerPort}`);
      }
      if (portNumbers.has(port.containerPort)) {
        errors.push(`Duplicate container port: ${port.containerPort}`);
      }
      portNumbers.add(port.containerPort);
    }

    if (config.buildStages.length === 0) {
      errors.push("At least one build stage is required");
    }

    if (config.buildStrategy === "multi_stage" && config.buildStages.length < 2) {
      errors.push("Multi-stage build requires at least 2 stages");
    }

    if (errors.length > 0) {
      throw new ContainerValidationError("Invalid container definition", errors);
    }
  }

  toRuntimeConfig(): ContainerRuntimeConfig {
    const finalStage = this.buildStages[this.buildStages.length - 1]!;

    return {
      type: this.runtimeType,
      name: this.name,
      image: `${this.metadata.name}:${this.metadata.version}`,
      command: undefined,
      entrypoint: undefined,
      ports: [...this.ports],
      volumes: [...this.volumes],
      environment: [...this.environment],
      healthChecks: [...this.healthChecks],
      resources: this.resources,
      logging: this.logging,
      secrets: this.secrets ? [...this.secrets] : undefined,
      restartPolicy: this.restartPolicy,
      securityProfile: { ...this.securityProfile },
      labels: { ...this.metadata.labels },
      stopGracePeriodMs: 30_000,
      readOnly: this.securityProfile.readonlyRootFilesystem,
      tmpfs: [...this.securityProfile.tmpfsMounts],
      init: true,
    };
  }

  validate(): string[] {
    const errors: string[] = [];

    for (const volume of this.volumes) {
      if (!volume.target.startsWith("/")) {
        errors.push(`Volume mount target must be absolute: ${volume.target}`);
      }
    }

    for (const healthCheck of this.healthChecks) {
      if (healthCheck.intervalMs <= 0) {
        errors.push(`Health check interval must be positive: ${healthCheck.type}`);
      }
    }

    return errors;
  }
}
