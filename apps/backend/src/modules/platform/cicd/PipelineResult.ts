import type {
  PipelineResultData,
  PipelineStageStatus,
  PipelineStageResult,
  QualityGateResult,
  ArtifactResult,
  DeploymentResult,
} from "./types.js";

export class PipelineResult {
  readonly pipelineId: string;
  readonly runId: string;
  readonly runNumber: number;
  readonly status: PipelineStageStatus;
  readonly startedAt: Date;
  readonly completedAt: Date;
  readonly durationMs: number;
  readonly stages: readonly PipelineStageResult[];
  readonly qualityGates: readonly QualityGateResult[];
  readonly artifacts: readonly ArtifactResult[];
  readonly deployments: readonly DeploymentResult[];
  readonly error?: string;
  readonly metadata: Readonly<Record<string, unknown>>;

  private constructor(data: PipelineResultData & { deployments?: DeploymentResult[] }) {
    this.pipelineId = data.pipelineId;
    this.runId = data.runId;
    this.runNumber = data.runNumber;
    this.status = data.status;
    this.startedAt = data.startedAt;
    this.completedAt = data.completedAt;
    this.durationMs = data.durationMs;
    this.stages = Object.freeze([...data.stages]);
    this.qualityGates = Object.freeze([...data.qualityGates]);
    this.artifacts = Object.freeze([...data.artifacts]);
    this.deployments = Object.freeze([...(data.deployments ?? [])]);
    this.error = data.error;
    this.metadata = Object.freeze({ ...data.metadata });
  }

  static create(data: PipelineResultData & { deployments?: DeploymentResult[] }): PipelineResult {
    return new PipelineResult(data);
  }

  isSuccess(): boolean {
    return this.status === "succeeded";
  }

  isFailed(): boolean {
    return this.status === "failed";
  }

  isCancelled(): boolean {
    return this.status === "cancelled";
  }

  hasBlockingFailures(): boolean {
    return this.qualityGates.some((g) => g.blocking && g.status === "failed");
  }

  getStage(type: string): PipelineStageResult | undefined {
    return this.stages.find((s) => s.type === type);
  }

  getFailedStages(): PipelineStageResult[] {
    return this.stages.filter((s) => s.status === "failed");
  }

  getArtifact(type: string): ArtifactResult | undefined {
    return this.artifacts.find((a) => a.type === type);
  }

  toData(): PipelineResultData {
    return {
      pipelineId: this.pipelineId,
      runId: this.runId,
      runNumber: this.runNumber,
      status: this.status,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      durationMs: this.durationMs,
      stages: [...this.stages],
      qualityGates: [...this.qualityGates],
      artifacts: [...this.artifacts],
      error: this.error,
      metadata: { ...this.metadata },
    };
  }
}
