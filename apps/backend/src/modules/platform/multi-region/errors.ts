export class MultiRegionError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "MultiRegionError";
    this.code = code;
  }
}

export class MultiRegionValidationError extends MultiRegionError {
  readonly validationErrors: readonly string[];

  constructor(message: string, validationErrors: string[]) {
    super(message, "MULTI_REGION_VALIDATION_ERROR");
    this.name = "MultiRegionValidationError";
    this.validationErrors = Object.freeze([...validationErrors]);
  }
}

export class RegionNotFoundError extends MultiRegionError {
  readonly regionId: string;

  constructor(regionId: string) {
    super(`Region not found: ${regionId}`, "REGION_NOT_FOUND");
    this.name = "RegionNotFoundError";
    this.regionId = regionId;
  }
}

export class RegionInactiveError extends MultiRegionError {
  readonly regionId: string;
  readonly status: string;

  constructor(regionId: string, status: string) {
    super(`Region ${regionId} is not active (current status: ${status})`, "REGION_INACTIVE");
    this.name = "RegionInactiveError";
    this.regionId = regionId;
    this.status = status;
  }
}

export class FailoverInProgressError extends MultiRegionError {
  readonly failoverId: string;

  constructor(failoverId: string) {
    super(`Failover is already in progress: ${failoverId}`, "FAILOVER_IN_PROGRESS");
    this.name = "FailoverInProgressError";
    this.failoverId = failoverId;
  }
}

export class FailoverExecutionError extends MultiRegionError {
  readonly failoverId: string;
  readonly stepName: string;

  constructor(failoverId: string, stepName: string, message: string) {
    super(`Failover ${failoverId} failed at step '${stepName}': ${message}`, "FAILOVER_EXECUTION_ERROR");
    this.name = "FailoverExecutionError";
    this.failoverId = failoverId;
    this.stepName = stepName;
  }
}

export class ReplicationError extends MultiRegionError {
  readonly configId: string;
  readonly sourceRegionId: string;
  readonly targetRegionId: string;

  constructor(configId: string, sourceRegionId: string, targetRegionId: string, message: string) {
    super(`Replication ${configId} (${sourceRegionId} → ${targetRegionId}): ${message}`, "REPLICATION_ERROR");
    this.name = "ReplicationError";
    this.configId = configId;
    this.sourceRegionId = sourceRegionId;
    this.targetRegionId = targetRegionId;
  }
}

export class DisasterRecoveryError extends MultiRegionError {
  readonly profileName: string;

  constructor(profileName: string, message: string) {
    super(`Disaster recovery '${profileName}': ${message}`, "DISASTER_RECOVERY_ERROR");
    this.name = "DisasterRecoveryError";
    this.profileName = profileName;
  }
}
