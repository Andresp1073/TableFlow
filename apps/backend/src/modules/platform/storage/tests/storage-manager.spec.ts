import { describe, it, expect } from "vitest";
import { StorageManager } from "../StorageManager.js";
import { StorageNotFoundError } from "../errors.js";
import type { StorageUploadRequest, StoragePolicyConfig } from "../types.js";

describe("StorageManager", () => {
  let manager: StorageManager;

  beforeEach(() => {
    manager = new StorageManager();
  });

  describe("upload", () => {
    it("uploads a file and returns result metadata", async () => {
      const request: StorageUploadRequest = {
        path: "test/hello.txt",
        content: "Hello, World!",
        contentType: "text/plain",
      };

      const result = await manager.provider.upload(request);

      expect(result.path).toBe("test/hello.txt");
      expect(result.id).toContain("obj_");
      expect(result.version).toContain("v");
      expect(result.checksum).toBeDefined();
      expect(result.contentLength).toBe(13);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("accepts upload without optional fields", async () => {
      const request: StorageUploadRequest = {
        path: "test/file.bin",
        content: "binary-data",
      };

      const result = await manager.provider.upload(request);

      expect(result.path).toBe("test/file.bin");
      expect(result.checksum).toBeDefined();
    });
  });

  describe("download", () => {
    it("throws StorageNotFoundError for nonexistent file", async () => {
      await expect(
        manager.provider.download("nonexistent/file.txt"),
      ).rejects.toThrow(StorageNotFoundError);
    });

    it("throws with bucket information", async () => {
      await expect(
        manager.provider.download("missing.txt", "custom-bucket"),
      ).rejects.toThrow(/custom-bucket/);
    });
  });

  describe("delete", () => {
    it("returns delete result metadata", async () => {
      const result = await manager.provider.delete("test/to-delete.txt");

      expect(result.path).toBe("test/to-delete.txt");
      expect(result.deleted).toBe(true);
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it("indicates permanent delete when versioning is disabled", async () => {
      const result = await manager.provider.delete("test/file.txt");

      expect(result.permanent).toBe(true);
    });

    it("indicates soft delete when versioning is enabled", async () => {
      const policy: StoragePolicyConfig = {
        bucket: "versioned-bucket",
        defaultPolicy: "versioned",
        allowedPolicies: ["versioned"],
        versioning: true,
        maxUploadSizeBytes: 1000000,
        allowedContentTypes: [],
      };

      manager.setPolicy(policy);

      const result = await manager.provider.delete("test/file.txt", "versioned-bucket");

      expect(result.permanent).toBe(false);
    });
  });

  describe("move", () => {
    it("returns move result with success", async () => {
      const result = await manager.provider.move("source/path.txt", "dest/path.txt");

      expect(result.sourcePath).toBe("source/path.txt");
      expect(result.destinationPath).toBe("dest/path.txt");
      expect(result.success).toBe(true);
    });

    it("generates new version when versioning is enabled", async () => {
      const policy: StoragePolicyConfig = {
        bucket: "v-bucket",
        defaultPolicy: "versioned",
        allowedPolicies: ["versioned"],
        versioning: true,
        maxUploadSizeBytes: 1000000,
        allowedContentTypes: [],
      };

      manager.setPolicy(policy);

      const result = await manager.provider.move("src.txt", "dst.txt", "v-bucket");

      expect(result.newVersion).toBeDefined();
      expect(result.newVersion).toContain("v");
    });
  });

  describe("copy", () => {
    it("returns copy result with destination version", async () => {
      const result = await manager.provider.copy("source/file.txt", "dest/file.txt");

      expect(result.sourcePath).toBe("source/file.txt");
      expect(result.destinationPath).toBe("dest/file.txt");
      expect(result.success).toBe(true);
      expect(result.destinationVersion).toContain("v");
    });
  });

  describe("exists", () => {
    it("returns false for nonexistent path", async () => {
      const result = await manager.provider.exists("nonexistent/file.txt");

      expect(result.exists).toBe(false);
      expect(result.path).toBe("nonexistent/file.txt");
    });
  });

  describe("list", () => {
    it("returns empty result for nonexistent prefix", async () => {
      const result = await manager.provider.list("nonexistent/");

      expect(result.objects).toHaveLength(0);
      expect(result.prefix).toBe("nonexistent/");
      expect(result.hasMore).toBe(false);
    });
  });

  describe("generateSignedUrl", () => {
    it("returns signed URL result with expiration", async () => {
      const result = await manager.provider.generateSignedUrl({
        path: "test/file.pdf",
        operation: "read",
        expiresInSeconds: 3600,
      });

      expect(result.path).toBe("test/file.pdf");
      expect(result.operation).toBe("read");
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("getObject", () => {
    it("returns null for nonexistent object", async () => {
      const result = await manager.provider.getObject("nonexistent/file.txt");

      expect(result).toBeNull();
    });
  });

  describe("policies", () => {
    it("sets and retrieves bucket policies", () => {
      const policy: StoragePolicyConfig = {
        bucket: "my-bucket",
        defaultPolicy: "public",
        allowedPolicies: ["public", "private"],
        versioning: false,
        maxUploadSizeBytes: 5000000,
        allowedContentTypes: ["image/jpeg", "image/png"],
      };

      manager.setPolicy(policy);

      const retrieved = manager.getPolicy("my-bucket");

      expect(retrieved).toBeDefined();
      expect(retrieved!.defaultPolicy).toBe("public");
      expect(retrieved!.maxUploadSizeBytes).toBe(5000000);
    });

    it("returns undefined for unknown bucket", () => {
      const result = manager.getPolicy("unknown-bucket");

      expect(result).toBeUndefined();
    });
  });
});
