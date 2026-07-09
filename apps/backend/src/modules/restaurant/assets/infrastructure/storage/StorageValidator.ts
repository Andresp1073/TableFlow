import { MimeType } from "../../domain/models/MimeType.js";
import { AssetType } from "../../domain/models/AssetType.js";
import { AssetTypeNotAllowedError } from "../../errors/AssetTypeNotAllowedError.js";
import { AssetDimensionsInvalidError } from "../../errors/AssetDimensionsInvalidError.js";

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_ASSETS_PER_TYPE: Record<string, number> = {
  logo: 1,
  cover: 1,
  gallery: 50,
  menu_image: 20,
  qr_image: 1,
  document: 10,
  brand_asset: 10,
};

export const ALLOWED_EXTENSIONS: readonly string[] = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".avif",
  ".pdf",
  ".tiff",
  ".tif",
];

export class StorageValidator {
  static validateAssetType(type: string): AssetType {
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
      throw new Error(`File size ${size} exceeds maximum ${MAX_FILE_SIZE}`);
    }
  }

  static validateImageDimensions(width: number | null, height: number | null): void {
    if (width === null || height === null) return;
    if (width <= 0 || height <= 0 || width > 10000 || height > 10000) {
      throw new AssetDimensionsInvalidError(width, height);
    }
  }

  static getMaxAssetsPerType(type: string): number {
    return MAX_ASSETS_PER_TYPE[type] ?? 50;
  }

  static isAllowedExtension(extension: string): boolean {
    return ALLOWED_EXTENSIONS.includes(extension.toLowerCase());
  }
}
