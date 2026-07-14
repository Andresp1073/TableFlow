# Storage Abstraction

## Architecture

The Storage module provides a cloud-agnostic abstraction for file storage operations. Business modules depend only on the `StorageProvider` interface (Dependency Inversion Principle).

```
┌──────────────────────────────────────────────────────────────┐
│                     Business Modules                          │
│              (depend only on StorageProvider)                  │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                     StorageProvider                            │
│              (interface — dependency inversion)                │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                      StorageManager                            │
│  ┌──────────┬──────────────┬─────────────┬───────────────┐    │
│  │ Storage  │ Storage      │ Storage     │ Storage       │    │
│  │ Policy   │ PathResolver │ Result      │ Event Pub.   │    │
│  └────┬─────┴──────┬───────┴──────┬──────┴────────┬──────┘    │
│       │            │              │               │           │
│  ┌────▼────┐  ┌────▼───────┐  ┌──▼─────────┐  ┌──▼────────┐ │
│  │ Access  │  │ Restaurant │  │ Checksum   │  │ FileUpload│ │
│  │ Policies│  │ /Menu /Res │  │ /Version   │  │ /Deleted  │ │
│  │         │  │ Paths      │  │ /ObjectId  │  │ Events    │ │
│  └─────────┘  └────────────┘  └────────────┘  └───────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Responsibility |
|---|---|
| **StorageProvider** | Interface consumed by business modules. Provides `upload`, `download`, `delete`, `move`, `copy`, `exists`, `list`, `generateSignedUrl`, `getObject`. |
| **StorageManager** | Main orchestrator implementing `StorageProvider`. Delegates policy enforcement and path resolution. |
| **StoragePolicy** | Access policy engine. Controls which operations are allowed per bucket based on policy type (public, private, temporary, read-only, versioned). |
| **StoragePathResolver** | Standardized path generation using named templates. Supports restaurant logos, menus, reservation attachments, user avatars, exports, backups, and custom paths. |
| **StorageResult** | Utility functions for checksum computation (Bernstein hash), version generation, object ID generation, and `buildStorageObject` factory. |

## Storage Lifecycle

```
  ┌───────────┐
  │  Upload   │  → Computes checksum, generates version + object ID
  └─────┬─────┘        Enforces policy (size, content type)
        │
  ┌─────▼─────┐
  │  Store    │  → (Future provider implementation)
  └─────┬─────┘
        │
  ┌─────▼──────┐
  │  Access    │  → Download, list, exists
  │  via Path  │
  └─────┬──────┘
        │
  ┌─────▼──────┐
  │  Manage    │  → Move, copy, delete
  │            │     Versioning-aware operations
  └─────┬──────┘
        │
  ┌─────▼───────┐
  │  Signed URL │  → Time-limited access URLs (prepared abstraction)
  └─────────────┘
```

## Operations

| Operation | Description | Policy Check |
|---|---|---|
| `upload` | Store a file at a given path | Upload validation (size, content type) |
| `download` | Retrieve file content by path | Read access |
| `delete` | Remove a file (soft/hard based on versioning) | Write access |
| `move` | Move file to new path (generates new version if versioned) | Write access |
| `copy` | Copy file to new path (generates destination version) | Read + Write access |
| `exists` | Check if file exists at path | Read access |
| `list` | List files under a prefix | Read access |
| `generateSignedUrl` | Generate time-limited access URL | Prepared abstraction |

## Object Model

```typescript
interface StorageObject {
  id: string;           // Unique object identifier (obj_*)
  path: string;         // Full path in bucket (e.g., "restaurants/r-123/logo.png")
  bucket: string;       // Storage bucket/container
  contentType: string;  // MIME type
  contentLength: number;// Size in bytes
  checksum: string;     // Bernstein hash (hex)
  version: string;      // Version identifier (v*)
  metadata: Record<string, string>;  // User-defined metadata
  policy: "public" | "private" | "temporary" | "read-only" | "versioned";
  createdAt: Date;
  updatedAt: Date;
}
```

## Policies

| Policy | Allowed Operations | Use Case |
|---|---|---|
| `public` | upload, download, delete, move, copy, list, exists | Public assets (logos, images) |
| `private` | upload, download, delete, move, copy, list, exists | Confidential documents |
| `temporary` | upload, download, delete, list, exists | Temp files, uploads in progress |
| `read-only` | download, list, exists | Published content, archives |
| `versioned` | upload, download, delete, move, copy, list, exists | Audit trails, document history |

### Policy Configuration

```typescript
interface StoragePolicyConfig {
  bucket: string;
  defaultPolicy: StorageAccessPolicy;
  allowedPolicies: StorageAccessPolicy[];
  versioning: boolean;           // Enable versioned deletes/moves
  maxUploadSizeBytes: number;    // Max upload size limit
  allowedContentTypes: string[]; // Allowed MIME types (empty = all)
}
```

## Path Conventions

### Standardized Path Templates

| Pattern | Template | Example |
|---|---|---|
| `restaurant-logo` | `restaurants/{restaurantId}/logo.{ext}` | `restaurants/r-123/logo.png` |
| `restaurant-menu` | `menus/{restaurantId}/{menuId}.{ext}` | `menus/r-123/m-789.pdf` |
| `reservation-attachment` | `reservations/{reservationId}/{filename}` | `reservations/res-abc/request.pdf` |
| `user-avatar` | `users/{userId}/avatar.{ext}` | `users/u-123/avatar.jpg` |
| `export` | `exports/{exportType}/{timestamp}-{id}.{ext}` | `exports/csv/2026-07-14T21-30-00-abc123.csv` |
| `backup` | `backups/{component}/{date}/{filename}` | `backups/database/2026-07-14/full-dump.sql` |
| `custom` | `custom/{path}` | `custom/any/path/file.txt` |

### Path Utilities

| Method | Description | Example |
|---|---|---|
| `resolve(Pattern, params, bucket?)` | Resolve a named template | `restaurants/r-123/logo.png` |
| `parsePath(path)` | Parse a path and identify the pattern | `{ pattern: "restaurant-logo", params: { restaurantId: "r-123", ext: "png" } }` |
| `join(...segments)` | Join path segments | `restaurants/r-123/logo.png` |
| `dirname(path)` | Get parent directory | `restaurants/r-123` |
| `basename(path)` | Get file name | `logo.png` |
| `extension(path)` | Get file extension | `png` |

### Convenience Methods

```typescript
pathResolver.resolveRestaurantLogo("r-123", "png")
// → { path: "restaurants/r-123/logo.png", bucket: "tableflow" }

pathResolver.resolveReservationAttachment("res-abc", "receipt.pdf")
// → { path: "reservations/res-abc/receipt.pdf", bucket: "tableflow" }
```

## Events Published

| Event | Trigger |
|---|---|
| `storage.file_uploaded` | File uploaded successfully |
| `storage.file_deleted` | File deleted (soft or permanent) |
| `storage.file_moved` | File moved to new path |
| `storage.validation_failed` | Upload validation failed (size, content type, policy) |

## Usage

### Setup

```typescript
import { StorageManager, StoragePathResolver } from "./platform/storage/index.js";

const pathResolver = new StoragePathResolver();
const storage = new StorageManager(pathResolver);

// Configure bucket policies
storage.setPolicy({
  bucket: "assets",
  defaultPolicy: "public",
  allowedPolicies: ["public", "private"],
  versioning: false,
  maxUploadSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
});

storage.setPolicy({
  bucket: "documents",
  defaultPolicy: "private",
  allowedPolicies: ["private"],
  versioning: true,
  maxUploadSizeBytes: 50 * 1024 * 1024, // 50MB
  allowedContentTypes: ["application/pdf"],
});
```

### Upload

```typescript
const { path } = pathResolver.resolveRestaurantLogo("r-42", "png");

const result = await storage.provider.upload({
  path,
  content: imageBuffer.toString("base64"),
  contentType: "image/png",
  contentLength: imageBuffer.length,
  bucket: "assets",
  metadata: { uploadedBy: "admin@example.com" },
});
// → { id: "obj_...", path: "restaurants/r-42/logo.png", version: "v...", checksum: "a1b2c3d4", ... }
```

### Download

```typescript
try {
  const file = await storage.provider.download("restaurants/r-42/logo.png", "assets");
  // → { content, contentType, contentLength, ... }
} catch (error) {
  if (error instanceof StorageNotFoundError) {
    // Handle not found
  }
}
```

### Delete

```typescript
const result = await storage.provider.delete("restaurants/r-42/old-logo.png", "assets");
// → { path, deleted: true, permanent: true/false, deletedAt }
```

### Move/Copy

```typescript
// Move with versioned bucket generates new version
await storage.provider.move("temp/upload.pdf", "documents/final.pdf", "documents");

// Copy creates independent object
await storage.provider.copy("template.docx", "documents/copy.docx", "documents");
```

### List

```typescript
const result = await storage.provider.list("restaurants/", "assets");
// → { objects: [...], prefix: "restaurants/", hasMore: false }
```

## Error Handling

| Error | Code | When |
|---|---|---|
| `StorageNotFoundError` | STORAGE_NOT_FOUND | Object not found |
| `StorageAlreadyExistsError` | STORAGE_ALREADY_EXISTS | Object already exists at path |
| `StorageValidationError` | STORAGE_VALIDATION_FAILED | Upload validation failed |
| `StoragePolicyError` | STORAGE_POLICY_VIOLATION | Operation not allowed by policy |

## Future Providers

The `StorageProvider` interface is designed for provider-agnostic implementation:

```typescript
class LocalStorageProvider implements StorageProvider {
  async upload(request: StorageUploadRequest): Promise<StorageUploadResult> {
    // Write to local filesystem
  }
}

class S3StorageProvider implements StorageProvider {
  async upload(request: StorageUploadRequest): Promise<StorageUploadResult> {
    // Upload to AWS S3
  }
}

class AzureBlobStorageProvider implements StorageProvider {
  async upload(request: StorageUploadRequest): Promise<StorageUploadResult> {
    // Upload to Azure Blob Storage
  }
}
```
