export class ContainerError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "ContainerError";
    this.code = code;
  }
}

export class ContainerValidationError extends ContainerError {
  readonly validationErrors: readonly string[];

  constructor(message: string, validationErrors: string[]) {
    super(message, "CONTAINER_VALIDATION_ERROR");
    this.name = "ContainerValidationError";
    this.validationErrors = Object.freeze([...validationErrors]);
  }
}

export class ContainerBuildError extends ContainerError {
  readonly stageName: string;

  constructor(stageName: string, message: string) {
    super(message, "CONTAINER_BUILD_ERROR");
    this.name = "ContainerBuildError";
    this.stageName = stageName;
  }
}

export class ContainerRuntimeError extends ContainerError {
  readonly containerId: string;

  constructor(containerId: string, message: string) {
    super(message, "CONTAINER_RUNTIME_ERROR");
    this.name = "ContainerRuntimeError";
    this.containerId = containerId;
  }
}

export class HealthCheckError extends ContainerError {
  readonly healthCheckType: string;

  constructor(healthCheckType: string, message: string) {
    super(message, "HEALTH_CHECK_ERROR");
    this.name = "HealthCheckError";
    this.healthCheckType = healthCheckType;
  }
}

export class SecurityProfileError extends ContainerError {
  constructor(message: string) {
    super(message, "SECURITY_PROFILE_ERROR");
    this.name = "SecurityProfileError";
  }
}
