import { describe, it, expect } from "vitest";
import { computeChecksum, generateVersion, generateObjectId, buildStorageObject } from "../StorageResult.js";

describe("StorageMetadata", () => {
  describe("computeChecksum", () => {
    it("produces a consistent checksum for same content", () => {
      const content = "Hello, World!";
      const hash1 = computeChecksum(content);
      const hash2 = computeChecksum(content);

      expect(hash1).toBe(hash2);
    });

    it("produces different checksums for different content", () => {
      const hash1 = computeChecksum("content-a");
      const hash2 = computeChecksum("content-b");

      expect(hash1).not.toBe(hash2);
    });

    it("returns a hex string", () => {
      const hash = computeChecksum("test");

      expect(hash).toMatch(/^[0-9a-f]{8}$/);
    });

    it("handles empty content", () => {
      const hash = computeChecksum("");

      expect(hash).toMatch(/^[0-9a-f]{8}$/);
    });
  });

  describe("generateVersion", () => {
    it("produces versions starting with v", () => {
      const version = generateVersion();

      expect(version).toMatch(/^v/);
    });

    it("produces unique versions", () => {
      const v1 = generateVersion();
      const v2 = generateVersion();

      expect(v1).not.toBe(v2);
    });

    it("includes timestamp component", () => {
      const version = generateVersion();

      expect(version.length).toBeGreaterThan(4);
    });
  });

  describe("generateObjectId", () => {
    it("produces IDs starting with obj_", () => {
      const id = generateObjectId();

      expect(id).toMatch(/^obj_/);
    });

    it("produces unique IDs", () => {
      const id1 = generateObjectId();
      const id2 = generateObjectId();

      expect(id1).not.toBe(id2);
    });
  });

  describe("buildStorageObject", () => {
    it("creates a storage object with defaults", () => {
      const obj = buildStorageObject();

      expect(obj.id).toMatch(/^obj_/);
      expect(obj.path).toBe("test/path.txt");
      expect(obj.bucket).toBe("tableflow");
      expect(obj.contentType).toBe("text/plain");
      expect(obj.policy).toBe("private");
      expect(obj.createdAt).toBeInstanceOf(Date);
      expect(obj.updatedAt).toBeInstanceOf(Date);
    });

    it("overrides with provided values", () => {
      const now = new Date();
      const obj = buildStorageObject({
        id: "custom-id",
        path: "custom/path/file.pdf",
        bucket: "custom-bucket",
        contentType: "application/pdf",
        contentLength: 5000,
        policy: "public",
        metadata: { author: "test" },
        createdAt: now,
        updatedAt: now,
      });

      expect(obj.id).toBe("custom-id");
      expect(obj.path).toBe("custom/path/file.pdf");
      expect(obj.bucket).toBe("custom-bucket");
      expect(obj.contentType).toBe("application/pdf");
      expect(obj.contentLength).toBe(5000);
      expect(obj.policy).toBe("public");
      expect(obj.metadata).toEqual({ author: "test" });
      expect(obj.createdAt).toBe(now);
      expect(obj.updatedAt).toBe(now);
    });

    it("computes checksum from content", () => {
      const obj = buildStorageObject();

      expect(obj.checksum).toMatch(/^[0-9a-f]{8}$/);
    });
  });
});
