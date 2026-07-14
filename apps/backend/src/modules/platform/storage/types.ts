import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";

export type StorageAccessPolicy = "public" | "private" | "temporary" | "read-only" | "versioned";

export type StorageOperation = "upload" | "download" | "delete" | "move" | "copy" | "list" | "exists";

export interface StorageObject {
  id: string;
  path: string;
  bucket: string;
  contentType: string;
  contentLength: number;
  checksum: string;
  version: string;
  metadata: Record<string, string>;
  policy: StorageAccessPolicy;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageUploadRequest {
  path: string;
  content: string;
  contentType?: string;
  contentLength?: number;
  bucket?: string;
  metadata?: Record<string, string>;
  policy?: StorageAccessPolicy;
}

export interface StorageUploadResult {
  id: string;
  path: string;
  bucket: string;
  version: string;
  checksum: string;
  contentLength: number;
  createdAt: Date;
}

export interface StorageDownloadResult {
  id: string;
  path: string;
  bucket: string;
  content: string;
  contentType: string;
  contentLength: number;
  metadata: Record<string, string>;
}

export interface StorageDeleteResult {
  path: string;
  bucket: string;
  deleted: boolean;
  permanent: boolean;
  deletedAt: Date;
}

export interface StorageMoveResult {
  sourcePath: string;
  destinationPath: string;
  bucket: string;
  success: boolean;
  newVersion?: string;
}

export interface StorageCopyResult {
  sourcePath: string;
  destinationPath: string;
  bucket: string;
  success: boolean;
  destinationVersion: string;
}

export interface StorageListEntry {
  id: string;
  path: string;
  bucket: string;
  contentType: string;
  contentLength: number;
  checksum: string;
  version: string;
  policy: StorageAccessPolicy;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageListResult {
  objects: StorageListEntry[];
  prefix: string;
  bucket: string;
  continuationToken?: string;
  hasMore: boolean;
}

export interface StorageExistsResult {
  exists: boolean;
  path: string;
  bucket: string;
}

export interface StorageSignedUrlRequest {
  path: string;
  operation: "read" | "write";
  expiresInSeconds: number;
}

export interface StorageSignedUrlResult {
  url: string;
  path: string;
  expiresAt: Date;
  operation: "read" | "write";
}

export interface StoragePolicyConfig {
  bucket: string;
  defaultPolicy: StorageAccessPolicy;
  allowedPolicies: StorageAccessPolicy[];
  versioning: boolean;
  maxUploadSizeBytes: number;
  allowedContentTypes: string[];
}

export interface StorageProvider {
  upload(request: StorageUploadRequest): Promise<StorageUploadResult>;
  download(path: string, bucket?: string): Promise<StorageDownloadResult>;
  delete(path: string, bucket?: string): Promise<StorageDeleteResult>;
  move(sourcePath: string, destinationPath: string, bucket?: string): Promise<StorageMoveResult>;
  copy(sourcePath: string, destinationPath: string, bucket?: string): Promise<StorageCopyResult>;
  exists(path: string, bucket?: string): Promise<StorageExistsResult>;
  list(prefix: string, bucket?: string): Promise<StorageListResult>;
  generateSignedUrl(request: StorageSignedUrlRequest): Promise<StorageSignedUrlResult>;
  getObject(path: string, bucket?: string): Promise<StorageObject | null>;
}

export interface StorageManagerInterface {
  readonly provider: StorageProvider;
  readonly pathResolver: import("./StoragePathResolver.js").StoragePathResolver;
  setPolicy(policy: StoragePolicyConfig): void;
  getPolicy(bucket: string): StoragePolicyConfig | undefined;
  setLogger(logger: Logger): void;
  setEventPublisher(publisher: EventPublisher): void;
}

export type StorageEventType =
  | "storage.file_uploaded"
  | "storage.file_deleted"
  | "storage.file_moved"
  | "storage.validation_failed";

export interface StorageEvent {
  type: StorageEventType;
  path: string;
  bucket: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export const DEFAULT_ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/csv",
  "application/json",
  "text/plain",
];

export const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
