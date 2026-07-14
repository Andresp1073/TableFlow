import { describe, it, expect } from "vitest";
import { StoragePolicy } from "../StoragePolicy.js";
import type { StoragePolicyConfig, StorageAccessPolicy } from "../types.js";

describe("StoragePolicy", () => {
  let policy: StoragePolicy;

  function createPolicy(overrides?: Partial<StoragePolicyConfig>): StoragePolicyConfig {
    return {
      bucket: "test-bucket",
      defaultPolicy: "private",
      allowedPolicies: ["private", "public"],
      versioning: false,
      maxUploadSizeBytes: 10000000,
      allowedContentTypes: ["image/jpeg", "image/png", "application/pdf"],
      ...overrides,
    };
  }

  beforeEach(() => {
    policy = new StoragePolicy();
  });

  describe("setPolicy and getPolicy", () => {
    it("stores and retrieves a policy", () => {
      const config = createPolicy();

      policy.setPolicy(config);
      const retrieved = policy.getPolicy("test-bucket");

      expect(retrieved).toBeDefined();
      expect(retrieved!.defaultPolicy).toBe("private");
    });

    it("returns undefined for unknown bucket", () => {
      const result = policy.getPolicy("unknown");

      expect(result).toBeUndefined();
    });

    it("overwrites existing policy", () => {
      policy.setPolicy(createPolicy({ defaultPolicy: "private" }));
      policy.setPolicy(createPolicy({ defaultPolicy: "public" }));

      const retrieved = policy.getPolicy("test-bucket");

      expect(retrieved!.defaultPolicy).toBe("public");
    });

    it("removes a policy", () => {
      policy.setPolicy(createPolicy());
      policy.removePolicy("test-bucket");

      expect(policy.getPolicy("test-bucket")).toBeUndefined();
    });
  });

  describe("validateOperation", () => {
    it("allows download for public bucket", () => {
      policy.setPolicy(createPolicy({ defaultPolicy: "public" }));

      expect(() => policy.validateOperation("file.txt", "test-bucket", "download")).not.toThrow();
    });

    it("blocks write operations for read-only bucket", () => {
      policy.setPolicy(createPolicy({ defaultPolicy: "read-only" }));

      expect(() => policy.validateOperation("file.txt", "test-bucket", "upload")).toThrow();
    });

    it("passes validation for undefined bucket (no policy)", () => {
      expect(() => policy.validateOperation("file.txt", "unknown-bucket", "upload")).not.toThrow();
    });
  });

  describe("validateUpload", () => {
    it("passes when upload is within limits", () => {
      policy.setPolicy(createPolicy());

      expect(() =>
        policy.validateUpload("photo.jpg", "test-bucket", "image/jpeg", 500000),
      ).not.toThrow();
    });

    it("rejects oversized uploads", () => {
      policy.setPolicy(createPolicy({ maxUploadSizeBytes: 1000 }));

      expect(() =>
        policy.validateUpload("large.jpg", "test-bucket", "image/jpeg", 2000),
      ).toThrow();
    });

    it("rejects disallowed content types", () => {
      policy.setPolicy(createPolicy({ allowedContentTypes: ["image/jpeg"] }));

      expect(() =>
        policy.validateUpload("file.gif", "test-bucket", "image/gif", 1000),
      ).toThrow();
    });

    it("passes validation when no policy exists", () => {
      expect(() =>
        policy.validateUpload("file.txt", "unknown", "text/plain", 1000),
      ).not.toThrow();
    });
  });

  describe("isOperationAllowed", () => {
    it("returns true for allowed operations", () => {
      policy.setPolicy(createPolicy({ defaultPolicy: "public" }));

      expect(policy.isOperationAllowed("test-bucket", "download")).toBe(true);
      expect(policy.isOperationAllowed("test-bucket", "upload")).toBe(true);
    });

    it("returns false for blocked operations on read-only", () => {
      policy.setPolicy(createPolicy({ defaultPolicy: "read-only" }));

      expect(policy.isOperationAllowed("test-bucket", "upload")).toBe(false);
      expect(policy.isOperationAllowed("test-bucket", "delete")).toBe(false);
    });

    it("returns true when no policy exists", () => {
      expect(policy.isOperationAllowed("unknown", "upload")).toBe(true);
    });
  });

  describe("getDefaultPolicy", () => {
    it("returns configured default policy", () => {
      policy.setPolicy(createPolicy({ defaultPolicy: "public" }));

      expect(policy.getDefaultPolicy("test-bucket")).toBe("public");
    });

    it("returns private for unknown bucket", () => {
      expect(policy.getDefaultPolicy("unknown")).toBe("private");
    });
  });

  describe("isVersioningEnabled", () => {
    it("returns true when versioning is enabled", () => {
      policy.setPolicy(createPolicy({ versioning: true }));

      expect(policy.isVersioningEnabled("test-bucket")).toBe(true);
    });

    it("returns false when versioning is disabled", () => {
      policy.setPolicy(createPolicy({ versioning: false }));

      expect(policy.isVersioningEnabled("test-bucket")).toBe(false);
    });

    it("returns false for unknown bucket", () => {
      expect(policy.isVersioningEnabled("unknown")).toBe(false);
    });
  });

  describe("getAllPolicies", () => {
    it("returns all registered policies", () => {
      policy.setPolicy(createPolicy({ bucket: "bucket-a" }));
      policy.setPolicy(createPolicy({ bucket: "bucket-b" }));

      const all = policy.getAllPolicies();

      expect(all).toHaveLength(2);
    });

    it("returns empty array when no policies", () => {
      expect(policy.getAllPolicies()).toHaveLength(0);
    });
  });
});
