import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RestaurantAsset } from "../domain/models/RestaurantAsset.js";
import type { AssetRepository } from "../domain/repositories/AssetRepository.js";
import type { AssetFactory } from "../domain/repositories/AssetFactory.js";
import type { StorageProvider, UploadResult } from "../infrastructure/storage/index.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import { EventBus } from "../../../../events/EventBus.js";
import { AssetApplicationService } from "../application/services/AssetApplicationService.js";
import { AssetType } from "../domain/models/AssetType.js";
import { StorageKey } from "../domain/models/StorageKey.js";
import { MimeType } from "../domain/models/MimeType.js";
import { AssetDTO } from "../application/dtos/AssetDTO.js";

const mockAuthContext: AuthorizationContext = {
  userId: "user-1",
  organizationId: "org-1",
  roles: [],
  permissions: [
    "restaurants.assets.read",
    "restaurants.assets.upload",
    "restaurants.assets.delete",
    "restaurants.assets.update",
  ],
  scope: { type: "organization", organizationId: "org-1" },
};

function createMockAsset(overrides?: Partial<RestaurantAsset>): RestaurantAsset {
  return {
    id: "asset-1",
    restaurantId: "rest-1",
    type: AssetType.reconstitute("logo"),
    name: "Test Logo",
    originalFilename: "logo.png",
    mimeType: MimeType.reconstitute("image/png"),
    extension: ".png",
    size: 1024,
    width: 200,
    height: 200,
    storageProvider: "local",
    storageKey: StorageKey.reconstitute("rest-1/logo/abc.png"),
    publicUrl: "/uploads/rest-1/logo/abc.png",
    isPrimary: false,
    metadata: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("AssetApplicationService", () => {
  let repository: AssetRepository;
  let factory: AssetFactory;
  let storageProvider: StorageProvider;
  let authService: AuthorizationService;
  let eventBus: EventBus;
  let service: AssetApplicationService;

  beforeEach(() => {
    repository = {
      findById: vi.fn(),
      findByRestaurantId: vi.fn(),
      findByRestaurantIdAndType: vi.fn(),
      findPrimaryByRestaurantIdAndType: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      countByRestaurantIdAndType: vi.fn(),
    };

    factory = {
      create: vi.fn().mockImplementation((data) => ({
        id: data.id,
        restaurantId: data.restaurantId,
        type: data.type,
        name: data.name,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        extension: data.extension,
        size: data.size,
        width: data.width,
        height: data.height,
        storageProvider: data.storageProvider,
        storageKey: data.storageKey,
        publicUrl: data.publicUrl,
        isPrimary: data.isPrimary,
        metadata: data.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      reconstitute: vi.fn(),
    };

    storageProvider = {
      name: "local",
      upload: vi.fn().mockResolvedValue({
        storageKey: "rest-1/logo/uploaded.png",
        publicUrl: "/uploads/rest-1/logo/uploaded.png",
        size: 2048,
        mimeType: "image/png",
        width: 400,
        height: 300,
      } as UploadResult),
      delete: vi.fn(),
      generatePublicUrl: vi.fn(),
    };

    authService = {
      authorize: vi.fn(),
      authorizeScoped: vi.fn(),
      createContext: vi.fn(),
      getPermissions: vi.fn(),
      setEvaluator: vi.fn(),
    };

    eventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      once: vi.fn(),
      off: vi.fn(),
      removeListener: vi.fn(),
    };

    service = new AssetApplicationService(
      repository,
      factory,
      storageProvider,
      authService,
      eventBus,
    );
  });

  describe("upload", () => {
    it("uploads an asset", async () => {
      vi.mocked(repository.countByRestaurantIdAndType).mockResolvedValue(0);
      vi.mocked(repository.save).mockResolvedValue(createMockAsset({ id: "new-asset" }));
      vi.mocked(authService.authorize).mockResolvedValue(undefined);

      const result = await service.upload(
        {
          restaurantId: "rest-1",
          type: "logo",
          name: "My Logo",
          fileBuffer: Buffer.from("test"),
          originalFilename: "logo.png",
          mimeType: "image/png",
          isPrimary: false,
        },
        mockAuthContext,
      );

      expect(result.restaurantId).toBe("rest-1");
      expect(result.type).toBe("logo");
      expect(authService.authorize).toHaveBeenCalledWith(
        mockAuthContext,
        "restaurants.assets.upload",
      );
      expect(storageProvider.upload).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalledWith("AssetUploaded", expect.any(Object));
    });

    it("rejects disallowed mime type", async () => {
      vi.mocked(authService.authorize).mockResolvedValue(undefined);

      await expect(
        service.upload(
          {
            restaurantId: "rest-1",
            type: "logo",
            name: "Bad File",
            fileBuffer: Buffer.from("test"),
            originalFilename: "file.exe",
            mimeType: "application/x-msdownload",
            isPrimary: false,
          },
          mockAuthContext,
        ),
      ).rejects.toThrow();
    });
  });

  describe("list", () => {
    it("returns all assets for a restaurant", async () => {
      const mock = [createMockAsset()];
      vi.mocked(repository.findByRestaurantId).mockResolvedValue(mock);
      vi.mocked(authService.authorize).mockResolvedValue(undefined);

      const result = await service.list({ restaurantId: "rest-1" }, mockAuthContext);

      expect(result).toHaveLength(1);
      expect(result[0].restaurantId).toBe("rest-1");
    });
  });

  describe("delete", () => {
    it("deletes an existing asset", async () => {
      vi.mocked(repository.findById).mockResolvedValue(createMockAsset());
      vi.mocked(authService.authorize).mockResolvedValue(undefined);

      await service.delete({ restaurantId: "rest-1", id: "asset-1" }, mockAuthContext);

      expect(storageProvider.delete).toHaveBeenCalled();
      expect(repository.delete).toHaveBeenCalledWith("asset-1");
    });

    it("throws for non-existent asset", async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        service.delete({ restaurantId: "rest-1", id: "nonexistent" }, mockAuthContext),
      ).rejects.toThrow();
    });
  });

  describe("replacePrimary", () => {
    it("sets asset as primary and unmarks old primary", async () => {
      const existingPrimary = createMockAsset({ id: "old-primary", isPrimary: true });
      const newPrimary = createMockAsset({ id: "new-primary", isPrimary: false });

      vi.mocked(repository.findById).mockResolvedValue(newPrimary);
      vi.mocked(repository.findPrimaryByRestaurantIdAndType).mockResolvedValue(existingPrimary);
      vi.mocked(repository.update).mockResolvedValueOnce({ ...existingPrimary, isPrimary: false });
      vi.mocked(repository.update).mockResolvedValueOnce({ ...newPrimary, isPrimary: true });
      vi.mocked(authService.authorize).mockResolvedValue(undefined);

      const result = await service.replacePrimary(
        { restaurantId: "rest-1", id: "new-primary" },
        mockAuthContext,
      );

      expect(result.id).toBe("new-primary");
      expect(result.isPrimary).toBe(true);
    });
  });
});
