import { AssetType } from "../../domain/models/AssetType.js";
import { MimeType } from "../../domain/models/MimeType.js";
import { StorageValidator, MAX_FILE_SIZE } from "../../infrastructure/storage/StorageValidator.js";
import { AssetTypeNotAllowedError } from "../../errors/AssetTypeNotAllowedError.js";
import { AssetFileTooLargeError } from "../../errors/AssetFileTooLargeError.js";
import { AssetNotFoundError } from "../../errors/AssetNotFoundError.js";
import { AssetLimitExceededError } from "../../errors/AssetLimitExceededError.js";
import type { AssetRepository } from "../../domain/repositories/AssetRepository.js";

export class AssetValidator {
  static validateType(type: string): AssetType {
    try {
      return AssetType.create(type);
    } catch {
      throw new AssetTypeNotAllowedError(type);
    }
  }

  static validateMimeType(mimeType: string): void {
    if (!MimeType.isAllowed(mimeType)) {
      throw new AssetTypeNotAllowedError(mimeType);
    }
  }

  static validateFileSize(size: number): void {
    if (size > MAX_FILE_SIZE) {
      throw new AssetFileTooLargeError(size, MAX_FILE_SIZE);
    }
  }

  static async validateAssetCount(
    repository: AssetRepository,
    restaurantId: string,
    type: string,
  ): Promise<void> {
    const max = StorageValidator.getMaxAssetsPerType(type);
    const current = await repository.countByRestaurantIdAndType(restaurantId, type);
    if (current >= max) {
      throw new AssetLimitExceededError(max, type);
    }
  }

  static async ensureAssetExists(
    repository: AssetRepository,
    id: string,
  ): Promise<NonNullable<Awaited<ReturnType<AssetRepository["findById"]>>>> {
    const asset = await repository.findById(id);
    if (!asset) {
      throw new AssetNotFoundError(id);
    }
    return asset;
  }
}
