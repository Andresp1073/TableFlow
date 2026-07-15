import type {
  PipelineContextData,
  PipelineStageType,
  PipelineStageStatus,
  StageExecutionState,
  PipelineTriggerType,
} from "./types.js";
import { generateEventId, generateCorrelationId } from "../event-bus/EventMetadata.js";

export class PipelineContext implements PipelineContextData {
  readonly pipelineId: string;
  readonly pipelineName: string;
  readonly version: string;
  readonly runId: string;
  readonly runNumber: number;
  readonly startedAt: Date;
  readonly triggeredBy: string;
  readonly triggerType: PipelineTriggerType;
  readonly branch?: string;
  readonly commitSha?: string;
  readonly commitMessage?: string;
  readonly author?: string;
  readonly environment?: string;
  readonly variables: Map<string, string>;
  readonly metadata: Record<string, unknown>;
  readonly stages: Map<PipelineStageType, StageExecutionState>;

  private constructor(data: PipelineContextData) {
    this.pipelineId = data.pipelineId;
    this.pipelineName = data.pipelineName;
    this.version = data.version;
    this.runId = data.runId;
    this.runNumber = data.runNumber;
    this.startedAt = data.startedAt;
    this.triggeredBy = data.triggeredBy;
    this.triggerType = data.triggerType;
    this.branch = data.branch;
    this.commitSha = data.commitSha;
    this.commitMessage = data.commitMessage;
    this.author = data.author;
    this.environment = data.environment;
    this.variables = data.variables;
    this.metadata = { ...data.metadata };
    this.stages = data.stages;
  }

  static create(overrides?: Partial<PipelineContextData>): PipelineContext {
    const now = new Date();

    const data: PipelineContextData = {
      pipelineId: overrides?.pipelineId ?? "",
      pipelineName: overrides?.pipelineName ?? "",
      version: overrides?.version ?? "1.0.0",
      runId: overrides?.runId ?? generateEventId(),
      runNumber: overrides?.runNumber ?? 1,
      startedAt: overrides?.startedAt ?? now,
      triggeredBy: overrides?.triggeredBy ?? "system",
      triggerType: overrides?.triggerType ?? "manual",
      branch: overrides?.branch,
      commitSha: overrides?.commitSha,
      commitMessage: overrides?.commitMessage,
      author: overrides?.author,
      environment: overrides?.environment,
      variables: overrides?.variables ?? new Map(),
      metadata: overrides?.metadata ?? {},
      stages: overrides?.stages ?? new Map(),
    };

    return new PipelineContext(data);
  }

  getStageState(type: PipelineStageType): StageExecutionState | undefined {
    return this.stages.get(type);
  }

  setStageState(type: PipelineStageType, state: StageExecutionState): void {
    this.stages.set(type, state);
  }

  getStageStatus(type: PipelineStageType): PipelineStageStatus | undefined {
    return this.stages.get(type)?.status;
  }

  toData(): PipelineContextData {
    return {
      pipelineId: this.pipelineId,
      pipelineName: this.pipelineName,
      version: this.version,
      runId: this.runId,
      runNumber: this.runNumber,
      startedAt: this.startedAt,
      triggeredBy: this.triggeredBy,
      triggerType: this.triggerType,
      branch: this.branch,
      commitSha: this.commitSha,
      commitMessage: this.commitMessage,
      author: this.author,
      environment: this.environment,
      variables: new Map(this.variables),
      metadata: { ...this.metadata },
      stages: new Map(this.stages),
    };
  }
}
