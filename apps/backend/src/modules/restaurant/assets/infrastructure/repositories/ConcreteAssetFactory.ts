import type { AssetFactory, CreateAssetData, ReconstituteAssetData } from "../../domain/repositories/AssetFactory.js";
import type { RestaurantAsset } from "../../domain/models/RestaurantAsset.js";
import { AssetType } from "../../domain/models/AssetType.js";
import { StorageKey } from "../../domain/models/StorageKey.js";
import { MimeType } from "../../domain/models/MimeType.js";

export class ConcreteAssetFactory implements AssetFactory {
  create(data: CreateAssetData): RestaurantAsset {
    return {
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
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  reconstitute(data: ReconstituteAssetData): RestaurantAsset {
    return {
      id: data.id,
      restaurantId: data.restaurantId,
      type: AssetType.reconstitute(data.type),
      name: data.name,
      originalFilename: data.originalFilename,
      mimeType: MimeType.reconstitute(data.mimeType),
      extension: data.extension,
      size: data.size,
      width: data.width,
      height: data.height,
      storageProvider: data.storageProvider,
      storageKey: StorageKey.reconstitute(data.storageKey),
      publicUrl: data.publicUrl,
      isPrimary: data.isPrimary,
      metadata: (data.metadata ?? null) as Record<string, unknown> | null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
