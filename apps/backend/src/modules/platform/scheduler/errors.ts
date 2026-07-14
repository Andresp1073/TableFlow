import type { ScheduleState, TriggerType } from "./types.js";

export class ScheduleError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly scheduleName?: string,
  ) {
    super(message);
    this.name = "ScheduleError";
  }
}

export class ScheduleNotFoundError extends ScheduleError {
  constructor(name: string) {
    super(
      `Schedule "${name}" not found`,
      "SCHEDULE_NOT_FOUND",
      name,
    );
    this.name = "ScheduleNotFoundError";
  }
}

export class ScheduleAlreadyExistsError extends ScheduleError {
  constructor(name: string) {
    super(
      `Schedule "${name}" already exists`,
      "SCHEDULE_ALREADY_EXISTS",
      name,
    );
    this.name = "ScheduleAlreadyExistsError";
  }
}

export class ScheduleStateTransitionError extends ScheduleError {
  constructor(name: string, from: ScheduleState, to: ScheduleState, reason: string) {
    super(
      `Cannot transition schedule "${name}" from "${from}" to "${to}": ${reason}`,
      "SCHEDULE_INVALID_STATE_TRANSITION",
      name,
    );
    this.name = "ScheduleStateTransitionError";
  }
}

export class ScheduleTriggerError extends ScheduleError {
  constructor(
    name: string,
    public readonly triggerType: TriggerType,
    reason: string,
  ) {
    super(
      `Trigger "${triggerType}" error for schedule "${name}": ${reason}`,
      "SCHEDULE_TRIGGER_ERROR",
      name,
    );
    this.name = "ScheduleTriggerError";
  }
}

export class ScheduleExecutionError extends ScheduleError {
  constructor(
    name: string,
    public readonly executionId: string,
    reason: string,
  ) {
    super(
      `Execution "${executionId}" failed for schedule "${name}": ${reason}`,
      "SCHEDULE_EXECUTION_FAILED",
      name,
    );
    this.name = "ScheduleExecutionError";
  }
}

export class SchedulePolicyViolationError extends ScheduleError {
  constructor(
    name: string,
    public readonly policy: string,
    reason: string,
  ) {
    super(
      `Policy "${policy}" violation for schedule "${name}": ${reason}`,
      "SCHEDULE_POLICY_VIOLATION",
      name,
    );
    this.name = "SchedulePolicyViolationError";
  }
}
