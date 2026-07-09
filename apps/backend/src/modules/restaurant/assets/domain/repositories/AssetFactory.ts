import type { AssetType } from "../models/AssetType.js";
import type { StorageKey } from "../models/StorageKey.js";
import type { MimeType } from "../models/MimeType.js";
import type { RestaurantAsset } from "../models/RestaurantAsset.js";

export interface CreateAssetData {
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

export interface ReconstituteAssetData {
  id: string;
  restaurantId: string;
  type: string;
  name: string;
  originalFilename: string;
  mimeType: string;
  extension: string;
  size: number;
  width: number | null;
  height: number | null;
  storageProvider: string;
  storageKey: string;
  publicUrl: string | null;
  isPrimary: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetFactory {
  create(data: CreateAssetData): RestaurantAsset;
  reconstitute(data: ReconstituteAssetData): RestaurantAsset;
}
