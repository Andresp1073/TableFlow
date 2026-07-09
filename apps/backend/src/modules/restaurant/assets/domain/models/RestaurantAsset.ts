import type { AssetType } from "./AssetType.js";
import type { StorageKey } from "./StorageKey.js";
import type { MimeType } from "./MimeType.js";

export interface RestaurantAsset {
  id: string;
  restaurantId: string;
  type: AssetType;
  name: string;
  originalFilename: string;
  mimeType: MimeType;
  extension: string;
  size: number;
  width: number | null;
  height: number | null;
  storageProvider: string;
  storageKey: StorageKey;
  publicUrl: string | null;
  isPrimary: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
