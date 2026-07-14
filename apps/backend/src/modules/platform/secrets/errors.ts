import type { SecretType } from "./types.js";

export class SecretError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly secretKey?: string,
    public readonly secretType?: SecretType,
  ) {
    super(message);
    this.name = "SecretError";
  }
}

export class SecretNotFoundError extends SecretError {
  constructor(key: string, type: SecretType) {
    super(
      `Secret "${key}" of type "${type}" not found`,
      "SECRET_NOT_FOUND",
      key,
      type,
    );
    this.name = "SecretNotFoundError";
  }
}

export class SecretExpiredError extends SecretError {
  constructor(key: string, type: SecretType, expiresAt: Date) {
    super(
      `Secret "${key}" of type "${type}" expired at ${expiresAt.toISOString()}`,
      "SECRET_EXPIRED",
      key,
      type,
    );
    this.name = "SecretExpiredError";
  }
}

export class SecretValidationFailedError extends SecretError {
  constructor(
    key: string,
    type: SecretType,
    public readonly errors: Array<{ field: string; message: string; code: string }>,
  ) {
    super(
      `Secret "${key}" validation failed: ${errors.map((e) => e.message).join("; ")}`,
      "SECRET_VALIDATION_FAILED",
      key,
      type,
    );
    this.name = "SecretValidationFailedError";
  }
}

export class SecretRotationFailedError extends SecretError {
  constructor(key: string, type: SecretType, reason: string) {
    super(
      `Rotation failed for secret "${key}": ${reason}`,
      "SECRET_ROTATION_FAILED",
      key,
      type,
    );
    this.name = "SecretRotationFailedError";
  }
}
