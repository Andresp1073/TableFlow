export class PipelineError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "PipelineError";
    this.code = code;
  }
}

export class PipelineValidationError extends PipelineError {
  readonly validationErrors: readonly string[];

  constructor(message: string, validationErrors: string[]) {
    super(message, "PIPELINE_VALIDATION_ERROR");
    this.name = "PipelineValidationError";
    this.validationErrors = Object.freeze([...validationErrors]);
  }
}

export class StageExecutionError extends PipelineError {
  readonly stageType: string;
  readonly attempt: number;

  constructor(stageType: string, message: string, attempt: number) {
    super(message, "STAGE_EXECUTION_ERROR");
    this.name = "StageExecutionError";
    this.stageType = stageType;
    this.attempt = attempt;
  }
}

export class QualityGateFailedError extends PipelineError {
  readonly gateType: string;

  constructor(gateType: string, message: string) {
    super(message, "QUALITY_GATE_FAILED");
    this.name = "QualityGateFailedError";
    this.gateType = gateType;
  }
}

export class DeploymentError extends PipelineError {
  readonly targetType: string;

  constructor(targetType: string, message: string) {
    super(message, "DEPLOYMENT_ERROR");
    this.name = "DeploymentError";
    this.targetType = targetType;
  }
}

export class PipelineNotFoundError extends PipelineError {
  readonly runId: string;

  constructor(runId: string) {
    super(`Pipeline run not found: ${runId}`, "PIPELINE_NOT_FOUND");
    this.name = "PipelineNotFoundError";
    this.runId = runId;
  }
}
