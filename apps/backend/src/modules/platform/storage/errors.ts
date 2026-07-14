import type { StorageObject, StorageAccessPolicy } from "./types.js";

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly path?: string,
    public readonly bucket?: string,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export class StorageNotFoundError extends StorageError {
  constructor(path: string, bucket?: string) {
    super(
      `Object not found at path "${path}"${bucket ? ` in bucket "${bucket}"` : ""}`,
      "STORAGE_NOT_FOUND",
      path,
      bucket,
    );
    this.name = "StorageNotFoundError";
  }
}

export class StorageAlreadyExistsError extends StorageError {
  constructor(path: string, bucket?: string) {
    super(
      `Object already exists at path "${path}"${bucket ? ` in bucket "${bucket}"` : ""}`,
      "STORAGE_ALREADY_EXISTS",
      path,
      bucket,
    );
    this.name = "StorageAlreadyExistsError";
  }
}

export class StorageValidationError extends StorageError {
  constructor(
    path: string,
    bucket: string | undefined,
    public readonly errors: Array<{ field: string; message: string }>,
  ) {
    super(
      `Storage validation failed for "${path}": ${errors.map((e) => e.message).join("; ")}`,
      "STORAGE_VALIDATION_FAILED",
      path,
      bucket,
    );
    this.name = "StorageValidationError";
  }
}

export class StoragePolicyError extends StorageError {
  constructor(path: string, bucket: string, policy: StorageAccessPolicy, operation: string) {
    super(
      `Policy "${policy}" does not allow operation "${operation}" on "${path}"`,
      "STORAGE_POLICY_VIOLATION",
      path,
      bucket,
    );
    this.name = "StoragePolicyError";
  }
}
