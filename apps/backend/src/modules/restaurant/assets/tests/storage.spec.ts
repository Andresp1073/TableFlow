import { describe, it, expect, beforeEach, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { LocalStorageProvider } from "../infrastructure/storage/LocalStorageProvider.js";

const TEST_DIR = path.resolve(process.cwd(), "uploads", "test-assets");

describe("LocalStorageProvider", () => {
  let provider: LocalStorageProvider;

  beforeEach(async () => {
    provider = new LocalStorageProvider();
    await fs.promises.rm(TEST_DIR, { recursive: true, force: true });
  });

  afterAll(async () => {
    await fs.promises.rm(TEST_DIR, { recursive: true, force: true });
  });

  it("uploads a file and returns metadata", async () => {
    const buffer = Buffer.from("fake-image-data");
    const result = await provider.upload(
      "rest-1",
      "logo",
      "test-logo.png",
      buffer,
      "image/png",
    );

    expect(result.storageKey).toContain("rest-1/logo/");
    expect(result.storageKey).toMatch(/\.png$/);
    expect(result.publicUrl).toBe(`/uploads/${result.storageKey}`);
    expect(result.size).toBe(15);
    expect(result.mimeType).toBe("image/png");
    expect(result.width).toBeNull();
    expect(result.height).toBeNull();
  });

  it("deletes a stored file", async () => {
    const buffer = Buffer.from("delete-me");
    const result = await provider.upload("rest-1", "cover", "delete.jpg", buffer, "image/jpeg");

    const fullPath = path.resolve(process.cwd(), "uploads", result.storageKey);
    expect(fs.existsSync(fullPath)).toBe(true);

    await provider.delete(result.storageKey);
    expect(fs.existsSync(fullPath)).toBe(false);
  });

  it("generates public URL", () => {
    const url = provider.generatePublicUrl("rest-1/logo/test.jpg");
    expect(url).toBe("/uploads/rest-1/logo/test.jpg");
  });
});
