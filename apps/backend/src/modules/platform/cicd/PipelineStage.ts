import type {
  PipelineStageType,
  PipelineStageStatus,
  PipelineStageConfig,
} from "./types.js";

export class PipelineStage {
  readonly type: PipelineStageType;
  readonly name: string;
  readonly description: string;
  readonly dependsOn: readonly PipelineStageType[];
  readonly timeoutMs: number;
  readonly retryCount: number;
  readonly retryDelayMs: number;
  readonly allowFailure: boolean;
  readonly environment: ReadonlyMap<string, string>;
  readonly qualityGates: readonly string[];

  constructor(config: PipelineStageConfig) {
    this.type = config.type;
    this.name = config.name;
    this.description = config.description ?? "";
    this.dependsOn = Object.freeze([...(config.dependsOn ?? [])]);
    this.timeoutMs = config.timeoutMs ?? 600_000;
    this.retryCount = config.retryCount ?? 0;
    this.retryDelayMs = config.retryDelayMs ?? 5_000;
    this.allowFailure = config.allowFailure ?? false;
    this.environment = new Map(Object.entries(config.environment ?? {}));
    this.qualityGates = Object.freeze([...(config.qualityGates ?? [])]);
  }

  canExecute(stageStatuses: Map<PipelineStageType, PipelineStageStatus>): boolean {
    for (const dependency of this.dependsOn) {
      const status = stageStatuses.get(dependency);
      if (status !== "succeeded") {
        return false;
      }
    }
    return true;
  }

  isFinalStatus(status: PipelineStageStatus): boolean {
    return status === "succeeded" || status === "failed" || status === "cancelled";
  }
}
