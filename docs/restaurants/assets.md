# Restaurant Assets

## Overview

The Restaurant Assets module provides unified media management for restaurants. It supports multiple asset types (logos, covers, gallery images, menu images, QR codes, documents, brand assets) with a provider-independent storage architecture.

## Architecture

The module follows Clean Architecture with DDD:

```
src/modules/restaurant/assets/
  domain/
    models/
      AssetType.ts        — Value Object: validated asset type enum
      StorageKey.ts       — Value Object: unique storage identifier
      MimeType.ts         — Value Object: MIME type with validation
      ImageSize.ts        — Value Object: width/height dimensions
      RestaurantAsset.ts  — Aggregate interface
    events/
      AssetUploaded.ts
      AssetDeleted.ts
      AssetPrimaryReplaced.ts
    services/
      StorageProvider.ts  — Interface for storage backends
      AssetUrlResolver.ts — Interface for public URL generation
  application/
    commands/
      UploadAssetCommand.ts
      DeleteAssetCommand.ts
      ReplacePrimaryAssetCommand.ts
    queries/
      ListAssetsQuery.ts
      GetAssetQuery.ts
    dto/
      AssetDTO.ts
      AssetMapper.ts
    services/
      AssetApplicationService.ts
      AssetValidator.ts
  infrastructure/
    repositories/
      PrismaAssetRepository.ts
      ConcreteAssetFactory.ts
    storage/
      LocalStorageProvider.ts  — Default file-system storage
      StorageValidator.ts      — Limits & validation rules
  presentation/
    controllers/
      AssetController.ts
    routes/
      assets.routes.ts
    validation/
      assets.validation.ts
  errors/
    AssetNotFoundError.ts
    AssetTypeNotAllowedError.ts
    AssetFileTooLargeError.ts
    AssetDimensionsInvalidError.ts
    AssetLimitExceededError.ts
```

## Storage Architecture

Storage is abstracted behind the `StorageProvider` interface, allowing backends to be swapped without changing business logic.

### Implementations

| Provider | Directory | Use Case |
|----------|-----------|----------|
| `LocalStorageProvider` | `./uploads/{restaurantId}/{type}/{uuid}.{ext}` | Development / single-server |

### Adding a Cloud Provider

1. Implement `StorageProvider` (and optionally `AssetUrlResolver`)
2. Inject it into `AssetApplicationService` via the constructor

## Asset Types & Limits

| Type | Limit | MIME Types |
|------|-------|------------|
| `logo` | 1 | image/* |
| `cover` | 1 | image/* |
| `gallery` | 50 | image/* |
| `menu_image` | 20 | image/* |
| `qr_image` | 1 | image/* |
| `document` | 10 | image/*, application/pdf |
| `brand_asset` | 10 | image/* |

## API Endpoints

All endpoints are prefixed with `/api/v1/restaurants/{restaurantId}`.

### `GET /assets`
List assets (optional `?type=` filter).  
Permission: `restaurants.assets.read`

### `POST /assets`
Upload a new asset (multipart/form-data).  
Permission: `restaurants.assets.upload`  
Fields: `file` (binary, required), `type` (string, required), `name` (string, optional), `isPrimary` (boolean, optional)

### `GET /assets/{assetId}`
Get a single asset by ID.  
Permission: `restaurants.assets.read`

### `DELETE /assets/{assetId}`
Delete an asset (file + record).  
Permission: `restaurants.assets.delete`

### `PATCH /assets/{assetId}/primary`
Mark an asset as the primary for its type (unmarks previous primary).  
Permission: `restaurants.assets.update`

## Events

| Event | Payload | When |
|-------|---------|------|
| `AssetUploaded` | `{ restaurantId, assetId, type, storageKey }` | After file is stored |
| `AssetDeleted` | `{ restaurantId, assetId, type, storageKey }` | Before file is deleted |
| `AssetPrimaryReplaced` | `{ restaurantId, assetId, type, previousPrimaryId }` | After primary is reassigned |

## Permissions

| Code | Description |
|------|-------------|
| `restaurants.assets.read` | View assets |
| `restaurants.assets.upload` | Upload new assets |
| `restaurants.assets.delete` | Delete existing assets |
| `restaurants.assets.update` | Update asset metadata / set primary |
