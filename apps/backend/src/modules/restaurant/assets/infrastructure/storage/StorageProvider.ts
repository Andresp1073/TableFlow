import type { UploadResult } from "./UploadResult.js";

export interface StorageProvider {
  readonly name: string;

  upload(
    restaurantId: string,
    type: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult>;

  delete(storageKey: string): Promise<void>;

  generatePublicUrl(storageKey: string): string;
}
