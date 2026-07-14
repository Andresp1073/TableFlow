import { describe, it, expect } from "vitest";
import { StorageManager } from "../StorageManager.js";
import { StoragePathResolver } from "../StoragePathResolver.js";
import { StoragePolicy } from "../StoragePolicy.js";
import type { StoragePolicyConfig } from "../types.js";

describe("Storage Integration", () => {
  let manager: StorageManager;
  let resolver: StoragePathResolver;

  beforeEach(() => {
    resolver = new StoragePathResolver();
    manager = new StorageManager(resolver);
  });

  it("uploads a restaurant logo and generates correct path", async () => {
    const { path, bucket } = resolver.resolveRestaurantLogo("r-42", "png");

    const result = await manager.provider.upload({
      path,
      content: "fake-image-binary-data",
      contentType: "image/png",
    });

    expect(result.path).toBe("restaurants/r-42/logo.png");
    expect(result.bucket).toBe("tableflow");
    expect(result.checksum).toBeDefined();
  });

  it("uploads a reservation attachment with path resolver", async () => {
    const { path } = resolver.resolveReservationAttachment("res-100", "menu-request.pdf");

    const result = await manager.provider.upload({
      path,
      content: "%PDF-1.4 fake pdf content",
      contentType: "application/pdf",
      contentLength: 31,
    });

    expect(result.path).toBe("reservations/res-100/menu-request.pdf");
  });

  it("enforces upload policies for a configured bucket", async () => {
    const policy: StoragePolicyConfig = {
      bucket: "images",
      defaultPolicy: "private",
      allowedPolicies: ["private"],
      versioning: false,
      maxUploadSizeBytes: 1000,
      allowedContentTypes: ["image/jpeg"],
    };

    manager.setPolicy(policy);

    const { path } = resolver.resolveRestaurantLogo("r-1", "jpg");

    await expect(
      manager.provider.upload({
        path,
        content: "x".repeat(2000),
        contentType: "image/png",
        bucket: "images",
      }),
    ).rejects.toThrow();
  });

  it("moves file from one path to another", async () => {
    const source = resolver.resolveRestaurantLogo("r-1", "png").path;
    const dest = resolver.resolveRestaurantLogo("r-1", "jpg").path;

    await manager.provider.upload({
      path: source,
      content: "logo-content",
      contentType: "image/png",
    });

    const moveResult = await manager.provider.move(source, dest);

    expect(moveResult.success).toBe(true);
    expect(moveResult.sourcePath).toBe(source);
    expect(moveResult.destinationPath).toBe(dest);
  });

  it("deletes an uploaded file within policy", async () => {
    const { path } = resolver.resolveUserAvatar("u-99", "jpg");

    await manager.provider.upload({
      path,
      content: "avatar-content",
      contentType: "image/jpeg",
    });

    const deleteResult = await manager.provider.delete(path);

    expect(deleteResult.deleted).toBe(true);
    expect(deleteResult.path).toBe(path);
  });

  it("lists files under a prefix", async () => {
    await manager.provider.upload({
      path: "restaurants/r-1/logo.png",
      content: "logo1",
      contentType: "image/png",
    });

    await manager.provider.upload({
      path: "restaurants/r-2/logo.png",
      content: "logo2",
      contentType: "image/png",
    });

    const listResult = await manager.provider.list("restaurants/");

    expect(listResult.prefix).toBe("restaurants/");
    expect(listResult.bucket).toBe("tableflow");
  });

  it("checks existence of files", async () => {
    const existsResult = await manager.provider.exists("nonexistent/file.txt");

    expect(existsResult.exists).toBe(false);
    expect(existsResult.path).toBe("nonexistent/file.txt");
  });

  it("generates signed URLs with correct expiration", async () => {
    const { path } = resolver.resolveRestaurantMenu("r-1", "m-1", "pdf");

    const signedUrl = await manager.provider.generateSignedUrl({
      path,
      operation: "read",
      expiresInSeconds: 300,
    });

    expect(signedUrl.path).toBe(path);
    expect(signedUrl.operation).toBe("read");

    const expectedExpiry = Date.now() + 300_000;

    expect(signedUrl.expiresAt.getTime()).toBeGreaterThan(expectedExpiry - 1000);
    expect(signedUrl.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiry + 1000);
  });

  it("supports versioned bucket operations", async () => {
    const policy: StoragePolicyConfig = {
      bucket: "versioned",
      defaultPolicy: "versioned",
      allowedPolicies: ["versioned"],
      versioning: true,
      maxUploadSizeBytes: 10000000,
      allowedContentTypes: [],
    };

    manager.setPolicy(policy);

    const result = await manager.provider.delete("test/file.txt", "versioned");

    expect(result.permanent).toBe(false);

    const moveResult = await manager.provider.move("a.txt", "b.txt", "versioned");

    expect(moveResult.newVersion).toBeDefined();
  });
});
