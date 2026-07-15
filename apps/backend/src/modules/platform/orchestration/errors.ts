export class OrchestrationError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "OrchestrationError";
    this.code = code;
  }
}

export class OrchestrationValidationError extends OrchestrationError {
  readonly validationErrors: readonly string[];

  constructor(message: string, validationErrors: string[]) {
    super(message, "ORCHESTRATION_VALIDATION_ERROR");
    this.name = "OrchestrationValidationError";
    this.validationErrors = Object.freeze([...validationErrors]);
  }
}

export class OrchestrationNotFoundError extends OrchestrationError {
  readonly resourceType: string;
  readonly resourceName: string;

  constructor(resourceType: string, resourceName: string) {
    super(`${resourceType} not found: ${resourceName}`, "ORCHESTRATION_NOT_FOUND");
    this.name = "OrchestrationNotFoundError";
    this.resourceType = resourceType;
    this.resourceName = resourceName;
  }
}

export class DeploymentFailedError extends OrchestrationError {
  readonly deploymentName: string;

  constructor(deploymentName: string, message: string) {
    super(message, "DEPLOYMENT_FAILED");
    this.name = "DeploymentFailedError";
    this.deploymentName = deploymentName;
  }
}

export class ScalingFailedError extends OrchestrationError {
  readonly policyName: string;

  constructor(policyName: string, message: string) {
    super(message, "SCALING_FAILED");
    this.name = "ScalingFailedError";
    this.policyName = policyName;
  }
}

export class ProviderNotFoundError extends OrchestrationError {
  readonly providerType: string;

  constructor(providerType: string) {
    super(`Orchestration provider not found: ${providerType}`, "PROVIDER_NOT_FOUND");
    this.name = "ProviderNotFoundError";
    this.providerType = providerType;
  }
}
