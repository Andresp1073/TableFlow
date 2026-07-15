import type {
  PipelineDefinitionConfig,
  PipelineStageConfig,
  QualityGateConfig,
  ArtifactConfig,
  DeploymentTargetConfig,
  PipelineTrigger,
  PipelineStageType,
} from "./types.js";
import { PIPELINE_STAGE_TYPES, QUALITY_GATE_TYPES, ARTIFACT_TYPES, DEPLOYMENT_TARGET_TYPES } from "./types.js";
import { PipelineValidationError } from "./errors.js";

export class PipelineDefinition {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly stages: readonly PipelineStageConfig[];
  readonly triggers: readonly PipelineTrigger[];
  readonly variables: ReadonlyMap<string, string>;
  readonly tags: readonly string[];
  readonly timeoutMs: number;
  readonly qualityGates: readonly QualityGateConfig[];
  readonly artifacts: readonly ArtifactConfig[];
  readonly deploymentTargets: readonly DeploymentTargetConfig[];

  private constructor(config: PipelineDefinitionConfig) {
    this.name = config.name;
    this.description = config.description ?? "";
    this.version = config.version;
    this.stages = Object.freeze([...config.stages]);
    this.triggers = Object.freeze([...(config.triggers ?? [])]);
    this.variables = new Map(Object.entries(config.variables ?? {}));
    this.tags = Object.freeze([...(config.tags ?? [])]);
    this.timeoutMs = config.timeoutMs ?? 3_600_000;
    this.qualityGates = Object.freeze([...(config.qualityGates ?? [])]);
    this.artifacts = Object.freeze([...(config.artifacts ?? [])]);
    this.deploymentTargets = Object.freeze([...(config.deploymentTargets ?? [])]);
  }

  static create(config: PipelineDefinitionConfig): PipelineDefinition {
    PipelineDefinition.validate(config);
    return new PipelineDefinition(config);
  }

  private static validate(config: PipelineDefinitionConfig): void {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push("Pipeline name is required");
    }

    if (!config.version || config.version.trim().length === 0) {
      errors.push("Pipeline version is required");
    }

    if (!config.stages || config.stages.length === 0) {
      errors.push("At least one stage is required");
    }

    if (config.stages) {
      const stageTypes = new Set<PipelineStageType>();
      for (const stage of config.stages) {
        if (!PIPELINE_STAGE_TYPES.includes(stage.type)) {
          errors.push(`Invalid stage type: ${stage.type}`);
        }
        if (stageTypes.has(stage.type)) {
          errors.push(`Duplicate stage type: ${stage.type}`);
        }
        stageTypes.add(stage.type);
      }
    }

    if (config.qualityGates) {
      for (const gate of config.qualityGates) {
        if (!QUALITY_GATE_TYPES.includes(gate.type)) {
          errors.push(`Invalid quality gate type: ${gate.type}`);
        }
      }
    }

    if (config.artifacts) {
      for (const artifact of config.artifacts) {
        if (!ARTIFACT_TYPES.includes(artifact.type)) {
          errors.push(`Invalid artifact type: ${artifact.type}`);
        }
      }
    }

    if (config.deploymentTargets) {
      for (const target of config.deploymentTargets) {
        if (!DEPLOYMENT_TARGET_TYPES.includes(target.type)) {
          errors.push(`Invalid deployment target type: ${target.type}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new PipelineValidationError(errors.join("; "), errors);
    }
  }

  getStage(type: PipelineStageType): PipelineStageConfig | undefined {
    return this.stages.find((s) => s.type === type);
  }

  getQualityGate(type: string): QualityGateConfig | undefined {
    return this.qualityGates.find((g) => g.type === type);
  }

  getArtifact(type: string): ArtifactConfig | undefined {
    return this.artifacts.find((a) => a.type === type);
  }

  getDeploymentTarget(type: string): DeploymentTargetConfig | undefined {
    return this.deploymentTargets.find((d) => d.type === type);
  }

  toConfig(): PipelineDefinitionConfig {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      stages: [...this.stages],
      triggers: [...this.triggers],
      variables: Object.fromEntries(this.variables),
      tags: [...this.tags],
      timeoutMs: this.timeoutMs,
      qualityGates: [...this.qualityGates],
      artifacts: [...this.artifacts],
      deploymentTargets: [...this.deploymentTargets],
    };
  }
}
