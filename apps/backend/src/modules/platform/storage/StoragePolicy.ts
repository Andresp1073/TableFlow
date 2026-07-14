import type { StorageAccessPolicy, StoragePolicyConfig, StorageOperation } from "./types.js";
import { StoragePolicyError } from "./errors.js";

const POLICY_OPERATIONS: Record<StorageAccessPolicy, StorageOperation[]> = {
  "public": ["upload", "download", "delete", "move", "copy", "list", "exists"],
  "private": ["upload", "download", "delete", "move", "copy", "list", "exists"],
  "temporary": ["upload", "download", "delete", "list", "exists"],
  "read-only": ["download", "list", "exists"],
  "versioned": ["upload", "download", "delete", "move", "copy", "list", "exists"],
};

export class StoragePolicy {
  private readonly policies: Map<string, StoragePolicyConfig> = new Map();

  setPolicy(config: StoragePolicyConfig): void {
    this.policies.set(config.bucket, config);
  }

  getPolicy(bucket: string): StoragePolicyConfig | undefined {
    return this.policies.get(bucket);
  }

  removePolicy(bucket: string): void {
    this.policies.delete(bucket);
  }

  getAllPolicies(): StoragePolicyConfig[] {
    return Array.from(this.policies.values());
  }

  validateOperation(path: string, bucket: string, operation: StorageOperation): void {
    const policy = this.policies.get(bucket);

    if (!policy) {
      return;
    }

    const allowed = POLICY_OPERATIONS[policy.defaultPolicy];

    if (!allowed?.includes(operation)) {
      throw new StoragePolicyError(path, bucket, policy.defaultPolicy, operation);
    }
  }

  validateUpload(path: string, bucket: string, contentType: string, contentLength: number): void {
    const policy = this.policies.get(bucket);

    if (!policy) {
      return;
    }

    if (contentLength > policy.maxUploadSizeBytes) {
      throw new StoragePolicyError(
        path,
        bucket,
        policy.defaultPolicy,
        `upload exceeds max size of ${policy.maxUploadSizeBytes} bytes`,
      );
    }

    if (policy.allowedContentTypes.length > 0 && !policy.allowedContentTypes.includes(contentType)) {
      throw new StoragePolicyError(
        path,
        bucket,
        policy.defaultPolicy,
        `content type "${contentType}" not allowed`,
      );
    }
  }

  isOperationAllowed(bucket: string, operation: StorageOperation): boolean {
    const policy = this.policies.get(bucket);

    if (!policy) {
      return true;
    }

    const allowed = POLICY_OPERATIONS[policy.defaultPolicy];

    return allowed?.includes(operation) ?? true;
  }

  getDefaultPolicy(bucket: string): StorageAccessPolicy {
    return this.policies.get(bucket)?.defaultPolicy ?? "private";
  }

  isVersioningEnabled(bucket: string): boolean {
    return this.policies.get(bucket)?.versioning ?? false;
  }
}
