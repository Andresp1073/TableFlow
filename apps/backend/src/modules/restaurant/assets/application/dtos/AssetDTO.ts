export interface AssetDTO {
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
  publicUrl: string | null;
  isPrimary: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
