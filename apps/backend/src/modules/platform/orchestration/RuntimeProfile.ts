import type {
  RuntimeProfileConfig,
  ResourceRequirements,
  ResourceSpec,
  Affinity,
  Toleration,
  TopologySpreadConstraint,
} from "./types.js";
import { OrchestrationValidationError } from "./errors.js";

export class RuntimeProfile {
  readonly name: string;
  readonly description: string;
  readonly resources: ResourceRequirements;
  readonly affinity?: Affinity;
  readonly nodeSelector: Readonly<Record<string, string>>;
  readonly tolerations: readonly Toleration[];
  readonly priorityClassName?: string;
  readonly schedulerName?: string;
  readonly topologySpreadConstraints: readonly TopologySpreadConstraint[];

  constructor(config: RuntimeProfileConfig) {
    RuntimeProfile.validate(config);

    this.name = config.name;
    this.description = config.description ?? "";
    this.resources = {
      requests: { ...config.resources.requests },
      limits: { ...config.resources.limits },
    };
    this.affinity = config.affinity ? JSON.parse(JSON.stringify(config.affinity)) : undefined;
    this.nodeSelector = Object.freeze({ ...(config.nodeSelector ?? {}) });
    this.tolerations = Object.freeze([...(config.tolerations ?? [])]);
    this.priorityClassName = config.priorityClassName;
    this.schedulerName = config.schedulerName;
    this.topologySpreadConstraints = Object.freeze([...(config.topologySpreadConstraints ?? [])]);
  }

  private static validate(config: RuntimeProfileConfig): void {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push("Runtime profile name is required");
    }

    if (!config.resources) {
      errors.push("Resource requirements are required");
    } else {
      RuntimeProfile.validateResourceSpec("requests", config.resources.requests, errors);
      RuntimeProfile.validateResourceSpec("limits", config.resources.limits, errors);
    }

    if (errors.length > 0) {
      throw new OrchestrationValidationError("Invalid runtime profile", errors);
    }
  }

  private static validateResourceSpec(label: string, spec: ResourceSpec, errors: string[]): void {
    if (!spec.cpu) {
      errors.push(`${label}.cpu is required`);
    }
    if (!spec.memory) {
      errors.push(`${label}.memory is required`);
    }
  }

  getCpuRequest(): string {
    return this.resources.requests.cpu;
  }

  getMemoryRequest(): string {
    return this.resources.requests.memory;
  }

  getCpuLimit(): string {
    return this.resources.limits.cpu;
  }

  getMemoryLimit(): string {
    return this.resources.limits.memory;
  }

  hasGpu(): boolean {
    return this.resources.limits.gpu !== undefined || this.resources.requests.gpu !== undefined;
  }

  hasAffinity(): boolean {
    return this.affinity !== undefined;
  }

  hasTolerations(): boolean {
    return this.tolerations.length > 0;
  }

  static createDefault(name: string): RuntimeProfile {
    return new RuntimeProfile({
      name,
      description: `Default profile for ${name}`,
      resources: {
        requests: { cpu: "100m", memory: "128Mi" },
        limits: { cpu: "500m", memory: "512Mi" },
      },
    });
  }

  static createMinimal(name: string): RuntimeProfile {
    return new RuntimeProfile({
      name,
      description: `Minimal resource profile for ${name}`,
      resources: {
        requests: { cpu: "50m", memory: "64Mi" },
        limits: { cpu: "200m", memory: "256Mi" },
      },
    });
  }

  static createProduction(name: string): RuntimeProfile {
    return new RuntimeProfile({
      name,
      description: `Production profile for ${name}`,
      resources: {
        requests: { cpu: "250m", memory: "256Mi" },
        limits: { cpu: "1", memory: "1Gi" },
      },
      affinity: {
        podAntiAffinity: {
          preferredDuringScheduling: [
            {
              weight: 100,
              podAffinityTerm: {
                labelSelector: {
                  matchLabels: { app: name },
                },
                topologyKey: "kubernetes.io/hostname",
              },
            },
          ],
        },
      },
      topologySpreadConstraints: [
        {
          maxSkew: 1,
          topologyKey: "topology.kubernetes.io/zone",
          whenUnsatisfiable: "ScheduleAnyway",
          labelSelector: {
            matchLabels: { app: name },
          },
        },
      ],
    });
  }
}
