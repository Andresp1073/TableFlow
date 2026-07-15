export class PerformanceError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "PerformanceError";
    this.code = code;
  }
}

export class PerformanceValidationError extends PerformanceError {
  readonly validationErrors: readonly string[];

  constructor(message: string, validationErrors: string[]) {
    super(message, "PERFORMANCE_VALIDATION_ERROR");
    this.name = "PerformanceValidationError";
    this.validationErrors = Object.freeze([...validationErrors]);
  }
}

export class PerformanceNotFoundError extends PerformanceError {
  readonly resourceType: string;
  readonly resourceName: string;

  constructor(resourceType: string, resourceName: string) {
    super(`${resourceType} not found: ${resourceName}`, "PERFORMANCE_NOT_FOUND");
    this.name = "PerformanceNotFoundError";
    this.resourceType = resourceType;
    this.resourceName = resourceName;
  }
}

export class AnalysisError extends PerformanceError {
  readonly analysisType: string;

  constructor(analysisType: string, message: string) {
    super(message, "ANALYSIS_ERROR");
    this.name = "AnalysisError";
    this.analysisType = analysisType;
  }
}

export class BottleneckDetectionError extends PerformanceError {
  readonly bottleneckType: string;

  constructor(bottleneckType: string, message: string) {
    super(message, "BOTTLENECK_DETECTION_ERROR");
    this.name = "BottleneckDetectionError";
    this.bottleneckType = bottleneckType;
  }
}

export class OptimizationError extends PerformanceError {
  readonly optimizationArea: string;

  constructor(optimizationArea: string, message: string) {
    super(message, "OPTIMIZATION_ERROR");
    this.name = "OptimizationError";
    this.optimizationArea = optimizationArea;
  }
}
