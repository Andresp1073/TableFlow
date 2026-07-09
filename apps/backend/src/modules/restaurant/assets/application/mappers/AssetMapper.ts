import type { RestaurantAsset } from "../../domain/models/RestaurantAsset.js";
import type { AssetDTO } from "../dtos/AssetDTO.js";

export class AssetMapper {
  static toDTO(asset: RestaurantAsset): AssetDTO {
    return {
      id: asset.id,
      restaurantId: asset.restaurantId,
      type: asset.type.value,
      name: asset.name,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType.value,
      extension: asset.extension,
      size: asset.size,
      width: asset.width,
      height: asset.height,
      storageProvider: asset.storageProvider,
      publicUrl: asset.publicUrl,
      isPrimary: asset.isPrimary,
      metadata: asset.metadata,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    };
  }

  static toDTOList(assets: RestaurantAsset[]): AssetDTO[] {
    return assets.map((a) => this.toDTO(a));
  }
}
