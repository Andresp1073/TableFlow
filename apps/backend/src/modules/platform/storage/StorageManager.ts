import type {
  StorageManagerInterface,
  StorageProvider,
  StorageUploadRequest,
  StorageUploadResult,
  StorageDownloadResult,
  StorageDeleteResult,
  StorageMoveResult,
  StorageCopyResult,
  StorageExistsResult,
  StorageListResult,
  StorageSignedUrlRequest,
  StorageSignedUrlResult,
  StorageObject,
  StoragePolicyConfig,
  Logger,
  EventPublisher,
} from "./types.js";
import { StoragePolicy } from "./StoragePolicy.js";
import { StoragePathResolver } from "./StoragePathResolver.js";
import { computeChecksum, generateVersion, generateObjectId } from "./StorageResult.js";
import { publishStorageEvent } from "./events.js";
import { StorageNotFoundError } from "./errors.js";

export class StorageManager implements StorageManagerInterface {
  readonly provider: StorageProvider;
  readonly pathResolver: StoragePathResolver;
  private readonly policy: StoragePolicy;
  private logger?: Logger;
  private eventPublisher?: EventPublisher;

  constructor(pathResolver?: StoragePathResolver) {
    this.pathResolver = pathResolver ?? new StoragePathResolver();
    this.policy = new StoragePolicy();
    this.provider = this.createProvider();
  }

  setPolicy(config: StoragePolicyConfig): void {
    this.policy.setPolicy(config);
    this.logger?.info(`Storage policy set for bucket: ${config.bucket}`, {
      defaultPolicy: config.defaultPolicy,
      versioning: config.versioning,
    });
  }

  getPolicy(bucket: string): StoragePolicyConfig | undefined {
    return this.policy.getPolicy(bucket);
  }

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  setEventPublisher(publisher: EventPublisher): void {
    this.eventPublisher = publisher;
  }

  private createProvider(): StorageProvider {
    const manager = this;

    return {
      async upload(request: StorageUploadRequest): Promise<StorageUploadResult> {
        const bucket = request.bucket ?? "tableflow";
        const contentType = request.contentType ?? "application/octet-stream";
        const contentLength = request.contentLength ?? request.content.length;
        const checksum = computeChecksum(request.content);
        const version = generateVersion();

        manager.policy.validateOperation(request.path, bucket, "upload");
        manager.policy.validateUpload(request.path, bucket, contentType, contentLength);

        const result: StorageUploadResult = {
          id: generateObjectId(),
          path: request.path,
          bucket,
          version,
          checksum,
          contentLength,
          createdAt: new Date(),
        };

        await publishStorageEvent(
          manager.eventPublisher,
          manager.logger,
          "storage.file_uploaded",
          request.path,
          bucket,
          { version, checksum, contentLength, contentType },
        );

        manager.logger?.info("File uploaded", {
          path: request.path,
          bucket,
          contentLength,
          contentType,
        });

        return result;
      },

      async download(path: string, bucket?: string): Promise<StorageDownloadResult> {
        const resolvedBucket = bucket ?? "tableflow";

        manager.policy.validateOperation(path, resolvedBucket, "download");

        throw new StorageNotFoundError(path, resolvedBucket);
      },

      async delete(path: string, bucket?: string): Promise<StorageDeleteResult> {
        const resolvedBucket = bucket ?? "tableflow";

        manager.policy.validateOperation(path, resolvedBucket, "delete");

        const result = {
          path,
          bucket: resolvedBucket,
          deleted: true,
          permanent: !manager.policy.isVersioningEnabled(resolvedBucket),
          deletedAt: new Date(),
        };

        await publishStorageEvent(
          manager.eventPublisher,
          manager.logger,
          "storage.file_deleted",
          path,
          resolvedBucket,
          { permanent: result.permanent },
        );

        manager.logger?.info("File deleted", { path, bucket: resolvedBucket });

        return result;
      },

      async move(sourcePath: string, destinationPath: string, bucket?: string): Promise<StorageMoveResult> {
        const resolvedBucket = bucket ?? "tableflow";

        manager.policy.validateOperation(sourcePath, resolvedBucket, "move");
        manager.policy.validateOperation(destinationPath, resolvedBucket, "move");

        const result = {
          sourcePath,
          destinationPath,
          bucket: resolvedBucket,
          success: true,
          newVersion: manager.policy.isVersioningEnabled(resolvedBucket) ? generateVersion() : undefined,
        };

        await publishStorageEvent(
          manager.eventPublisher,
          manager.logger,
          "storage.file_moved",
          sourcePath,
          resolvedBucket,
          { destinationPath, newVersion: result.newVersion },
        );

        manager.logger?.info("File moved", { sourcePath, destinationPath, bucket: resolvedBucket });

        return result;
      },

      async copy(sourcePath: string, destinationPath: string, bucket?: string): Promise<StorageCopyResult> {
        const resolvedBucket = bucket ?? "tableflow";

        manager.policy.validateOperation(sourcePath, resolvedBucket, "copy");
        manager.policy.validateOperation(destinationPath, resolvedBucket, "copy");

        return {
          sourcePath,
          destinationPath,
          bucket: resolvedBucket,
          success: true,
          destinationVersion: generateVersion(),
        };
      },

      async exists(path: string, bucket?: string): Promise<StorageExistsResult> {
        const resolvedBucket = bucket ?? "tableflow";

        manager.policy.validateOperation(path, resolvedBucket, "exists");

        return { exists: false, path, bucket: resolvedBucket };
      },

      async list(prefix: string, bucket?: string): Promise<StorageListResult> {
        const resolvedBucket = bucket ?? "tableflow";

        manager.policy.validateOperation(prefix, resolvedBucket, "list");

        return { objects: [], prefix, bucket: resolvedBucket, hasMore: false };
      },

      async generateSignedUrl(request: StorageSignedUrlRequest): Promise<StorageSignedUrlResult> {
        const bucket = "tableflow";

        manager.policy.validateOperation(request.path, bucket, "download");

        return {
          url: "",
          path: request.path,
          expiresAt: new Date(Date.now() + request.expiresInSeconds * 1000),
          operation: request.operation,
        };
      },

      async getObject(_path: string, _bucket?: string): Promise<StorageObject | null> {
        return null;
      },
    };
  }
}
