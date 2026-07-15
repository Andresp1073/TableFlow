import type {
  DeploymentTargetConfig,
  DeploymentTargetType,
  DeploymentStatus,
  DeploymentResult,
} from "./types.js";
import { DEPLOYMENT_TARGET_TYPES } from "./types.js";
import { PipelineValidationError } from "./errors.js";

export class DeploymentTarget {
  readonly type: DeploymentTargetType;
  readonly name: string;
  readonly description: string;
  readonly url?: string;
  readonly requiredApproval: boolean;
  readonly approvers: readonly string[];
  readonly allowedBranches: readonly string[];
  readonly requiredChecks: readonly string[];
  readonly maxConcurrentDeployments: number;
  readonly autoRollback: boolean;
  readonly timeoutMs: number;

  constructor(config: DeploymentTargetConfig) {
    if (!DEPLOYMENT_TARGET_TYPES.includes(config.type)) {
      throw new PipelineValidationError(`Invalid deployment target type: ${config.type}`, []);
    }

    this.type = config.type;
    this.name = config.name;
    this.description = config.description ?? "";
    this.url = config.url;
    this.requiredApproval = config.requiredApproval;
    this.approvers = Object.freeze([...(config.approvers ?? [])]);
    this.allowedBranches = Object.freeze([...(config.allowedBranches ?? [])]);
    this.requiredChecks = Object.freeze([...(config.requiredChecks ?? [])]);
    this.maxConcurrentDeployments = config.maxConcurrentDeployments ?? 1;
    this.autoRollback = config.autoRollback ?? true;
    this.timeoutMs = config.timeoutMs ?? 600_000;
  }

  canDeploy(branch?: string): { allowed: boolean; reason?: string } {
    if (this.allowedBranches.length > 0) {
      if (!branch) {
        return { allowed: false, reason: "No branch specified" };
      }
      if (!this.allowedBranches.includes(branch)) {
        return { allowed: false, reason: `Branch '${branch}' is not in allowed branches: ${this.allowedBranches.join(", ")}` };
      }
    }

    return { allowed: true };
  }

  requiresApproval(): boolean {
    return this.requiredApproval;
  }

  createDeploymentResult(
    status: DeploymentStatus,
    overrides?: Partial<Omit<DeploymentResult, "type" | "name" | "status" | "metadata">>,
  ): DeploymentResult {
    return {
      type: this.type,
      name: this.name,
      status,
      url: overrides?.url ?? this.url,
      deployedAt: overrides?.deployedAt,
      deployedBy: overrides?.deployedBy,
      version: overrides?.version,
      rollbackVersion: overrides?.rollbackVersion,
      error: overrides?.error,
      metadata: {},
    };
  }
}

export class DeploymentTargetFactory {
  static createDevelopment(config?: Partial<DeploymentTargetConfig>): DeploymentTarget {
    return new DeploymentTarget({
      type: "development",
      name: config?.name ?? "Development",
      description: config?.description ?? "Development environment for local testing",
      url: config?.url ?? "http://localhost:3000",
      requiredApproval: config?.requiredApproval ?? false,
      approvers: config?.approvers,
      allowedBranches: config?.allowedBranches,
      requiredChecks: config?.requiredChecks,
      maxConcurrentDeployments: config?.maxConcurrentDeployments ?? 5,
      autoRollback: config?.autoRollback ?? false,
      timeoutMs: config?.timeoutMs ?? 300_000,
    });
  }

  static createTesting(config?: Partial<DeploymentTargetConfig>): DeploymentTarget {
    return new DeploymentTarget({
      type: "testing",
      name: config?.name ?? "Testing",
      description: config?.description ?? "Testing environment for QA verification",
      url: config?.url,
      requiredApproval: config?.requiredApproval ?? false,
      approvers: config?.approvers,
      allowedBranches: config?.allowedBranches ?? ["develop", "feature/*", "fix/*"],
      requiredChecks: config?.requiredChecks ?? ["unit_tests", "integration_tests"],
      maxConcurrentDeployments: config?.maxConcurrentDeployments ?? 3,
      autoRollback: config?.autoRollback ?? true,
      timeoutMs: config?.timeoutMs ?? 300_000,
    });
  }

  static createStaging(config?: Partial<DeploymentTargetConfig>): DeploymentTarget {
    return new DeploymentTarget({
      type: "staging",
      name: config?.name ?? "Staging",
      description: config?.description ?? "Staging environment for pre-production validation",
      url: config?.url,
      requiredApproval: config?.requiredApproval ?? true,
      approvers: config?.approvers ?? [],
      allowedBranches: config?.allowedBranches ?? ["develop", "release/*"],
      requiredChecks: config?.requiredChecks ?? ["unit_tests", "integration_tests", "security_scan"],
      maxConcurrentDeployments: config?.maxConcurrentDeployments ?? 1,
      autoRollback: config?.autoRollback ?? true,
      timeoutMs: config?.timeoutMs ?? 600_000,
    });
  }

  static createProduction(config?: Partial<DeploymentTargetConfig>): DeploymentTarget {
    return new DeploymentTarget({
      type: "production",
      name: config?.name ?? "Production",
      description: config?.description ?? "Production environment for live traffic",
      url: config?.url,
      requiredApproval: config?.requiredApproval ?? true,
      approvers: config?.approvers ?? [],
      allowedBranches: config?.allowedBranches ?? ["main", "master"],
      requiredChecks: config?.requiredChecks ?? [
        "unit_tests",
        "integration_tests",
        "security_scan",
        "dependency_audit",
        "coverage",
      ],
      maxConcurrentDeployments: config?.maxConcurrentDeployments ?? 1,
      autoRollback: config?.autoRollback ?? true,
      timeoutMs: config?.timeoutMs ?? 900_000,
    });
  }
}
