export class MonitoringError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "MonitoringError";
    this.code = code;
  }
}

export class MonitoringValidationError extends MonitoringError {
  readonly validationErrors: readonly string[];

  constructor(message: string, validationErrors: string[]) {
    super(message, "MONITORING_VALIDATION_ERROR");
    this.name = "MonitoringValidationError";
    this.validationErrors = Object.freeze([...validationErrors]);
  }
}

export class MonitoringNotFoundError extends MonitoringError {
  readonly resourceType: string;
  readonly resourceName: string;

  constructor(resourceType: string, resourceName: string) {
    super(`${resourceType} not found: ${resourceName}`, "MONITORING_NOT_FOUND");
    this.name = "MonitoringNotFoundError";
    this.resourceType = resourceType;
    this.resourceName = resourceName;
  }
}

export class AlertEvaluationError extends MonitoringError {
  readonly policyName: string;

  constructor(policyName: string, message: string) {
    super(message, "ALERT_EVALUATION_ERROR");
    this.name = "AlertEvaluationError";
    this.policyName = policyName;
  }
}

export class SloBreachError extends MonitoringError {
  readonly sloName: string;

  constructor(sloName: string, message: string) {
    super(message, "SLO_BREACH_ERROR");
    this.name = "SloBreachError";
    this.sloName = sloName;
  }
}
