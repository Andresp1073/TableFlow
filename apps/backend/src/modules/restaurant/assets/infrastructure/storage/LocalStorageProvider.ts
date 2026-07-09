import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import type { StorageProvider } from "./StorageProvider.js";
import type { UploadResult } from "./UploadResult.js";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";

  async upload(
    restaurantId: string,
    type: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult> {
    const ext = path.extname(fileName);
    const storageKey = `${restaurantId}/${type}/${randomUUID()}${ext}`;
    const fullPath = path.join(UPLOADS_DIR, storageKey);

    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);

    let width: number | null = null;
    let height: number | null = null;

    if (mimeType.startsWith("image/")) {
      try {
        const dimensions = await this.getImageDimensions(fullPath);
        width = dimensions.width;
        height = dimensions.height;
      } catch {
        // Non-decodable image, leave dimensions null
      }
    }

    return {
      storageKey,
      publicUrl: this.generatePublicUrl(storageKey),
      size: buffer.length,
      mimeType,
      width,
      height,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const fullPath = path.join(UPLOADS_DIR, storageKey);

    try {
      await fs.promises.unlink(fullPath);
      await this.cleanupEmptyDirs(path.dirname(fullPath));
    } catch {
      // File may not exist — ignore
    }
  }

  generatePublicUrl(storageKey: string): string {
    return `/uploads/${storageKey}`;
  }

  private async cleanupEmptyDirs(dirPath: string): Promise<void> {
    try {
      const entries = await fs.promises.readdir(dirPath);
      if (entries.length === 0) {
        await fs.promises.rmdir(dirPath);
        const parent = path.dirname(dirPath);
        if (parent !== UPLOADS_DIR) {
          await this.cleanupEmptyDirs(parent);
        }
      }
    } catch {
      // Ignore errors during cleanup
    }
  }

  private async getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
    const buffer = await fs.promises.readFile(filePath);
    const { parseImageDimensions } = await import("../../../../utils/imageDimensions.js");
    return parseImageDimensions(buffer);
  }
}
