import type {
  PipelineDefinitionConfig,
  PipelineContextData,
  PipelineResultData,
  PipelineStageStatus,
  StageHandler,
  StageExecutionState,
  PipelineStageType,
  PipelineStageResult,
  QualityGateResult,
  ArtifactResult,
  CiCdProvider,
  CiCdProviderType,
} from "./types.js";
import { PipelineStage } from "./PipelineStage.js";
import { PipelineContext } from "./PipelineContext.js";
import { PipelineResult } from "./PipelineResult.js";
import { QualityGateEvaluator } from "./QualityGate.js";
import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";
import { publishCiCdEvent } from "./events.js";
import { StageExecutionError, PipelineNotFoundError } from "./errors.js";
import { generateEventId } from "../event-bus/EventMetadata.js";

export class PipelineExecutor {
  private readonly stageHandlers: Map<PipelineStageType, StageHandler> = new Map();
  private readonly qualityGateEvaluator: QualityGateEvaluator;
  private readonly providers: Map<CiCdProviderType, CiCdProvider> = new Map();
  private readonly results: Map<string, PipelineResult> = new Map();
  private readonly logger?: Logger;
  private readonly eventPublisher?: EventPublisher;
  private runCounter = 0;

  constructor(options?: {
    logger?: Logger;
    eventPublisher?: EventPublisher;
    stageHandlers?: StageHandler[];
    qualityGateEvaluator?: QualityGateEvaluator;
  }) {
    this.logger = options?.logger;
    this.eventPublisher = options?.eventPublisher;
    this.qualityGateEvaluator = options?.qualityGateEvaluator ?? new QualityGateEvaluator();

    if (options?.stageHandlers) {
      for (const handler of options.stageHandlers) {
        this.registerStageHandler(handler);
      }
    }
  }

  registerStageHandler(handler: StageHandler): void {
    this.stageHandlers.set(handler.stageType, handler);
  }

  registerProvider(provider: CiCdProvider): void {
    this.providers.set(provider.providerType, provider);
  }

  getProvider(providerType: CiCdProviderType): CiCdProvider | undefined {
    return this.providers.get(providerType);
  }

  async execute(
    definition: PipelineDefinitionConfig,
    contextOverride?: Partial<PipelineContextData>,
  ): Promise<PipelineResult> {
    this.runCounter++;

    const context = PipelineContext.create({
      pipelineId: generateEventId(),
      pipelineName: definition.name,
      version: definition.version,
      runNumber: this.runCounter,
      ...contextOverride,
    });

    await publishCiCdEvent(
      this.eventPublisher,
      this.logger,
      "pipeline.started",
      definition.name,
      context.runId,
      { version: definition.version },
    );

    try {
      const result = await this.executeStages(definition, context);
      this.results.set(context.runId, result);

      const eventType = result.isSuccess() ? "pipeline.completed" : "pipeline.failed";
      await publishCiCdEvent(
        this.eventPublisher,
        this.logger,
        eventType,
        definition.name,
        context.runId,
        { status: result.status, durationMs: result.durationMs },
      );

      return result;
    } catch (error) {
      const failedResult = this.buildFailedResult(definition, context, error);
      this.results.set(context.runId, failedResult);

      await publishCiCdEvent(
        this.eventPublisher,
        this.logger,
        "pipeline.failed",
        definition.name,
        context.runId,
        { error: error instanceof Error ? error.message : String(error) },
      );

      return failedResult;
    }
  }

  private async executeStages(
    definition: PipelineDefinitionConfig,
    context: PipelineContext,
  ): Promise<PipelineResult> {
    const stageResults: PipelineStageResult[] = [];
    const qualityGateResults: QualityGateResult[] = [];
    const artifactResults: ArtifactResult[] = [];
    const pipelineStartTime = Date.now();
    let finalStatus: PipelineStageStatus = "succeeded";

    const pipelineStages = definition.stages.map((s) => new PipelineStage(s));
    const stageStatusMap = new Map<PipelineStageType, PipelineStageStatus>();

    for (const stage of pipelineStages) {
      stageStatusMap.set(stage.type, "pending");
    }

    for (const stage of pipelineStages) {
      if (finalStatus === "cancelled") {
        stageStatusMap.set(stage.type, "skipped");
        continue;
      }

      if (!stage.canExecute(stageStatusMap)) {
        stageStatusMap.set(stage.type, "skipped");
        stageResults.push({
          type: stage.type,
          name: stage.name,
          status: "skipped",
          attempt: 0,
        });
        continue;
      }

      const stageResult = await this.executeStage(stage, context, definition);
      stageResults.push(stageResult);
      stageStatusMap.set(stage.type, stageResult.status);

      if (stageResult.status === "failed" && !stage.allowFailure) {
        finalStatus = "failed";
      }

      if (stage.qualityGates.length > 0) {
        const gateResults = this.qualityGateEvaluator.evaluateGates(stageResult, stage.qualityGates);
        qualityGateResults.push(...gateResults);

        if (this.qualityGateEvaluator.hasBlockingFailures(gateResults)) {
          finalStatus = "failed";
        }
      }

      if (stage.type === "artifact_build" || stage.type === "artifact_publish") {
        if (stageResult.status === "succeeded" && stageResult.output?.artifacts) {
          const artifacts = stageResult.output.artifacts as ArtifactResult[];
          artifactResults.push(...artifacts);
        }
      }
    }

    if (finalStatus === "pending" || finalStatus === "running") {
      finalStatus = "succeeded";
    }

    const pipelineDuration = Date.now() - pipelineStartTime;

    return PipelineResult.create({
      pipelineId: context.pipelineId,
      runId: context.runId,
      runNumber: context.runNumber,
      status: finalStatus,
      startedAt: context.startedAt,
      completedAt: new Date(),
      durationMs: pipelineDuration,
      stages: stageResults,
      qualityGates: qualityGateResults,
      artifacts: artifactResults,
      metadata: context.metadata,
    });
  }

  private async executeStage(
    stage: PipelineStage,
    context: PipelineContext,
    definition: PipelineDefinitionConfig,
  ): Promise<PipelineStageResult> {
    const handler = this.stageHandlers.get(stage.type);
    const startTime = Date.now();
    const stageStartTime = new Date();

    const initialState: StageExecutionState = {
      status: "running",
      startedAt: stageStartTime,
      attempt: 1,
    };
    context.setStageState(stage.type, initialState);

    await publishCiCdEvent(
      this.eventPublisher,
      this.logger,
      "pipeline.stage_started",
      definition.name,
      context.runId,
      { stageType: stage.type, stageName: stage.name },
    );

    try {
      let lastError: Error | undefined;
      const maxAttempts = stage.retryCount + 1;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          if (handler) {
            const handlerResult = await handler.execute(context.toData(), this.logger);

            const completedState: StageExecutionState = {
              status: handlerResult.status === "failed" && stage.allowFailure ? "succeeded" : handlerResult.status,
              startedAt: handlerResult.startedAt ?? stageStartTime,
              completedAt: handlerResult.completedAt ?? new Date(),
              durationMs: handlerResult.durationMs ?? (Date.now() - startTime),
              attempt,
              error: handlerResult.error,
              output: handlerResult.output,
            };
            context.setStageState(stage.type, completedState);

            const isFailure = handlerResult.status === "failed" || handlerResult.status === "cancelled";

            if (isFailure && !stage.allowFailure) {
              lastError = new StageExecutionError(stage.type, handlerResult.error ?? "Stage failed", attempt);
              continue;
            }

            if (attempt > 1 && isFailure && stage.allowFailure) {
              this.logger?.warn(`Stage ${stage.type} failed but allowFailure is true, marking as succeeded`, {
                stageType: stage.type,
                attempt,
              });
            }

            const stageResult = this.buildStageResult(stage, handlerResult, startTime, attempt);
            await this.publishStageCompletion(definition, context, stageResult);
            return stageResult;
          }

          const noHandlerState: StageExecutionState = {
            status: "skipped",
            completedAt: new Date(),
            durationMs: 0,
            attempt,
          };
          context.setStageState(stage.type, noHandlerState);

          const skippedResult: PipelineStageResult = {
            type: stage.type,
            name: stage.name,
            status: "skipped",
            startedAt: stageStartTime,
            completedAt: new Date(),
            durationMs: 0,
            attempt,
          };

          await this.publishStageCompletion(definition, context, skippedResult);
          return skippedResult;
        } catch (attemptError) {
          lastError = attemptError instanceof Error ? attemptError : new Error(String(attemptError));

          if (attempt < maxAttempts) {
            this.logger?.warn(`Stage ${stage.type} attempt ${attempt} failed, retrying`, {
              stageType: stage.type,
              attempt,
              error: lastError.message,
            });
            await this.delay(stage.retryDelayMs);
          }
        }
      }

      throw lastError ?? new StageExecutionError(stage.type, "Stage failed after all retries", maxAttempts);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      const failedState: StageExecutionState = {
        status: stage.allowFailure ? "succeeded" : "failed",
        startedAt: stageStartTime,
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
        attempt: 1,
        error: errorMessage,
      };
      context.setStageState(stage.type, failedState);

      const stageResult: PipelineStageResult = {
        type: stage.type,
        name: stage.name,
        status: stage.allowFailure ? "succeeded" : "failed",
        startedAt: stageStartTime,
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
        attempt: 1,
        error: errorMessage,
      };

      await this.publishStageCompletion(definition, context, stageResult);
      return stageResult;
    }
  }

  private async publishStageCompletion(
    definition: PipelineDefinitionConfig,
    context: PipelineContext,
    stageResult: PipelineStageResult,
  ): Promise<void> {
    const eventType = stageResult.status === "succeeded"
      ? "pipeline.stage_completed"
      : "pipeline.stage_failed";

    await publishCiCdEvent(
      this.eventPublisher,
      this.logger,
      eventType,
      definition.name,
      context.runId,
      {
        stageType: stageResult.type,
        stageName: stageResult.name,
        stageStatus: stageResult.status,
        durationMs: stageResult.durationMs,
      },
    );
  }

  private buildStageResult(
    stage: PipelineStage,
    handlerResult: StageExecutionState,
    startTime: number,
    attempt: number,
  ): PipelineStageResult {
    const finalStatus = (handlerResult.status === "failed" && stage.allowFailure) ? "succeeded" : handlerResult.status;

    return {
      type: stage.type,
      name: stage.name,
      status: finalStatus,
      startedAt: handlerResult.startedAt ?? new Date(startTime),
      completedAt: handlerResult.completedAt ?? new Date(),
      durationMs: handlerResult.durationMs ?? (Date.now() - startTime),
      attempt,
      error: handlerResult.error,
      output: handlerResult.output,
    };
  }

  private buildFailedResult(
    definition: PipelineDefinitionConfig,
    context: PipelineContext,
    error: unknown,
  ): PipelineResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const now = new Date();
    const duration = now.getTime() - context.startedAt.getTime();

    return PipelineResult.create({
      pipelineId: context.pipelineId,
      runId: context.runId,
      runNumber: context.runNumber,
      status: "failed",
      startedAt: context.startedAt,
      completedAt: now,
      durationMs: duration,
      stages: [],
      qualityGates: [],
      artifacts: [],
      error: errorMessage,
      metadata: context.metadata,
    });
  }

  async cancel(runId: string): Promise<void> {
    const result = this.results.get(runId);
    if (!result) {
      throw new PipelineNotFoundError(runId);
    }

    const cancelledResult = PipelineResult.create({
      ...result.toData(),
      status: "cancelled",
      completedAt: new Date(),
      durationMs: new Date().getTime() - result.startedAt.getTime(),
    });

    this.results.set(runId, cancelledResult);
  }

  getStatus(runId: string): PipelineResult | null {
    return this.results.get(runId) ?? null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
