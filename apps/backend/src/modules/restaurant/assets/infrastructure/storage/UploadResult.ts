export interface UploadResult {
  storageKey: string;
  publicUrl: string | null;
  size: number;
  mimeType: string;
  width: number | null;
  height: number | null;
}
