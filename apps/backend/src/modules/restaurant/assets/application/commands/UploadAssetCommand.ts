export interface UploadAssetCommand {
  restaurantId: string;
  type: string;
  name: string;
  fileBuffer: Buffer;
  originalFilename: string;
  mimeType: string;
  isPrimary?: boolean;
}
