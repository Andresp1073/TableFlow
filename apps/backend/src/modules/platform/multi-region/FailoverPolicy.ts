import type { FailoverConfig, FailoverExecution, FailoverStepResult, FailoverState, FailoverPolicy as FailoverPolicyInterface } from "./types.js";
import { generateEventId } from "../event-bus/EventMetadata.js";
import { MultiRegionValidationError, FailoverExecutionError } from "./errors.js";
import type { Logger } from "../observability/types.js";

abstract class BaseFailoverPolicy implements FailoverPolicyInterface {
  abstract readonly type: "automatic" | "manual";
  protected readonly logger?: Logger;

  constructor(options?: { logger?: Logger }) {
    this.logger = options?.logger;
  }

  abstract execute(config: FailoverConfig): Promise<FailoverExecution>;

  validate(config: FailoverConfig): string[] {
    const errors: string[] = [];

    if (!config.id || config.id.trim().length === 0) {
      errors.push("Failover config ID is required");
    }

    if (!config.sourceRegionId || config.sourceRegionId.trim().length === 0) {
      errors.push("Source region ID is required");
    }

    if (!config.targetRegionId || config.targetRegionId.trim().length === 0) {
      errors.push("Target region ID is required");
    }

    if (config.sourceRegionId === config.targetRegionId) {
      errors.push("Source and target regions must be different");
    }

    if (!config.steps || config.steps.length === 0) {
      errors.push("At least one failover step is required");
    }

    return errors;
  }

  async rollback(execution: FailoverExecution): Promise<FailoverExecution> {
    const rollbackSteps: FailoverStepResult[] = [];

    for (const step of [...execution.steps].reverse()) {
      rollbackSteps.push({
        stepName: `rollback:${step.stepName}`,
        success: true,
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 0,
        output: { rolledBack: true },
      });
    }

    return {
      ...execution,
      state: "rollback",
      currentStep: 0,
      steps: rollbackSteps,
      error: execution.error,
    };
  }

  protected async executeSteps(
    config: FailoverConfig,
    initialState: FailoverState,
  ): Promise<FailoverExecution> {
    const steps: FailoverStepResult[] = [];
    const executionId = generateEventId();

    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i]!;
      const startedAt = new Date();

      try {
        await this.delay(step.timeoutMs);
        const completedAt = new Date();

        steps.push({
          stepName: step.name,
          success: true,
          startedAt,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
          output: { simulated: true },
        });

        this.logger?.info(`Failover step '${step.name}' completed`, {
          failoverId: executionId,
          step: i + 1,
          total: config.steps.length,
        });
      } catch (error) {
        const completedAt = new Date();
        const errorMessage = error instanceof Error ? error.message : String(error);

        steps.push({
          stepName: step.name,
          success: false,
          startedAt,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
          error: errorMessage,
        });

        this.logger?.error(`Failover step '${step.name}' failed`, {
          failoverId: executionId,
          step: i + 1,
          error: errorMessage,
        });

        if (step.required) {
          throw new FailoverExecutionError(executionId, step.name, errorMessage);
        }
      }
    }

    const allSuccess = steps.every((s) => s.success);
    const completedAt = new Date();

    return {
      id: executionId,
      configId: config.id,
      state: allSuccess ? "completed" : "failed",
      startedAt: new Date(),
      completedAt,
      currentStep: steps.length,
      steps,
      error: allSuccess ? undefined : "Some non-required steps failed",
    };
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, Math.min(ms, 10)));
  }
}

export class AutomaticFailoverPolicy extends BaseFailoverPolicy {
  readonly type: "automatic" = "automatic";

  async execute(config: FailoverConfig): Promise<FailoverExecution> {
    const validationErrors = this.validate(config);
    if (validationErrors.length > 0) {
      throw new MultiRegionValidationError("Invalid automatic failover configuration", validationErrors);
    }

    this.logger?.info("Starting automatic failover", {
      sourceId: config.sourceRegionId,
      targetId: config.targetRegionId,
    });

    return this.executeSteps(config, "initiating");
  }
}

export class ManualFailoverPolicy extends BaseFailoverPolicy {
  readonly type: "manual" = "manual";

  async execute(config: FailoverConfig): Promise<FailoverExecution> {
    const validationErrors = this.validate(config);
    if (validationErrors.length > 0) {
      throw new MultiRegionValidationError("Invalid manual failover configuration", validationErrors);
    }

    this.logger?.info("Starting manual failover", {
      sourceId: config.sourceRegionId,
      targetId: config.targetRegionId,
    });

    return this.executeSteps(config, "initiating");
  }
}

export function createFailoverPolicy(type: "automatic" | "manual", options?: { logger?: Logger }): FailoverPolicyInterface {
  switch (type) {
    case "automatic":
      return new AutomaticFailoverPolicy(options);
    case "manual":
      return new ManualFailoverPolicy(options);
  }
}
