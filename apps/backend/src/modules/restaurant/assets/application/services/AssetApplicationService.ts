import { randomUUID } from "crypto";
import path from "path";
import type { AuthorizationContext } from "../../../../authorization/domain/models/AuthorizationContext.js";
import type { AuthorizationService } from "../../../../authorization/application/services/AuthorizationService.js";
import type { StorageProvider } from "../../infrastructure/storage/StorageProvider.js";
import type { AssetRepository } from "../../domain/repositories/AssetRepository.js";
import type { AssetFactory } from "../../domain/repositories/AssetFactory.js";
import type { EventBus } from "../../../../../events/EventBus.js";
import type { AssetDTO } from "../dtos/AssetDTO.js";
import type { UploadAssetCommand } from "../commands/UploadAssetCommand.js";
import type { DeleteAssetCommand } from "../commands/DeleteAssetCommand.js";
import type { ReplacePrimaryAssetCommand } from "../commands/ReplacePrimaryAssetCommand.js";
import type { ListAssetsQuery } from "../queries/ListAssetsQuery.js";
import type { GetAssetQuery } from "../queries/GetAssetQuery.js";
import { AssetMapper } from "../mappers/AssetMapper.js";
import { AssetValidator } from "../validators/AssetValidator.js";
import { AssetUploaded } from "../../domain/events/AssetUploaded.js";
import { AssetDeleted } from "../../domain/events/AssetDeleted.js";
import { AssetPrimaryReplaced } from "../../domain/events/AssetPrimaryReplaced.js";
import { AssetType } from "../../domain/models/AssetType.js";
import { StorageKey } from "../../domain/models/StorageKey.js";
import { MimeType } from "../../domain/models/MimeType.js";
import type { RestaurantNotFoundError } from "../../../errors/RestaurantNotFoundError.js";

type AssetPermission = "restaurants.assets.read" | "restaurants.assets.upload" | "restaurants.assets.delete" | "restaurants.assets.update";

export class AssetApplicationService {
  constructor(
    private readonly repository: AssetRepository,
    private readonly factory: AssetFactory,
    private readonly storageProvider: StorageProvider,
    private readonly authorizationService: AuthorizationService,
    private readonly eventBus: EventBus,
  ) {}

  async upload(
    command: UploadAssetCommand,
    auth: AuthorizationContext,
  ): Promise<AssetDTO> {
    await this.authorize(auth, "restaurants.assets.upload");

    const assetType = AssetValidator.validateType(command.type);
    AssetValidator.validateMimeType(command.mimeType);
    AssetValidator.validateFileSize(command.fileBuffer.length);
    await AssetValidator.validateAssetCount(this.repository, command.restaurantId, assetType.value);

    const ext = path.extname(command.originalFilename).toLowerCase();
    const uploadResult = await this.storageProvider.upload(
      command.restaurantId,
      assetType.value,
      command.originalFilename,
      command.fileBuffer,
      command.mimeType,
    );

    const shouldBePrimary = command.isPrimary ?? false;
    let previousPrimaryId: string | null = null;

    if (shouldBePrimary) {
      const existing = await this.repository.findPrimaryByRestaurantIdAndType(
        command.restaurantId,
        assetType.value,
      );
      if (existing) {
        previousPrimaryId = existing.id;
        await this.repository.update({
          ...existing,
          isPrimary: false,
        });
      }
    }

    const asset = this.factory.create({
      id: randomUUID(),
      restaurantId: command.restaurantId,
      type: assetType,
      name: command.name,
      originalFilename: command.originalFilename,
      mimeType: MimeType.reconstitute(uploadResult.mimeType),
      extension: ext,
      size: uploadResult.size,
      width: uploadResult.width,
      height: uploadResult.height,
      storageProvider: this.storageProvider.name,
      storageKey: StorageKey.reconstitute(uploadResult.storageKey),
      publicUrl: uploadResult.publicUrl,
      isPrimary: shouldBePrimary,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.repository.save(asset);

    this.eventBus.emit("AssetUploaded", new AssetUploaded(
      saved.id,
      saved.restaurantId,
      saved.type.value,
      saved.originalFilename,
    ));

    return AssetMapper.toDTO(saved);
  }

  async list(query: ListAssetsQuery, auth: AuthorizationContext): Promise<AssetDTO[]> {
    await this.authorize(auth, "restaurants.assets.read");

    const assets = query.type
      ? await this.repository.findByRestaurantIdAndType(query.restaurantId, query.type)
      : await this.repository.findByRestaurantId(query.restaurantId);

    return AssetMapper.toDTOList(assets);
  }

  async get(query: GetAssetQuery, auth: AuthorizationContext): Promise<AssetDTO> {
    await this.authorize(auth, "restaurants.assets.read");

    const asset = await AssetValidator.ensureAssetExists(this.repository, query.id);
    return AssetMapper.toDTO(asset);
  }

  async delete(command: DeleteAssetCommand, auth: AuthorizationContext): Promise<void> {
    await this.authorize(auth, "restaurants.assets.delete");

    const asset = await AssetValidator.ensureAssetExists(this.repository, command.id);

    await this.storageProvider.delete(asset.storageKey.value);
    await this.repository.delete(command.id);

    this.eventBus.emit("AssetDeleted", new AssetDeleted(
      asset.id,
      asset.restaurantId,
      asset.storageKey.value,
    ));
  }

  async replacePrimary(
    command: ReplacePrimaryAssetCommand,
    auth: AuthorizationContext,
  ): Promise<AssetDTO> {
    await this.authorize(auth, "restaurants.assets.update");

    const newPrimary = await AssetValidator.ensureAssetExists(this.repository, command.id);

    if (newPrimary.isPrimary) return AssetMapper.toDTO(newPrimary);

    const existing = await this.repository.findPrimaryByRestaurantIdAndType(
      command.restaurantId,
      newPrimary.type.value,
    );

    let previousPrimaryId: string | null = null;

    if (existing) {
      previousPrimaryId = existing.id;
      await this.repository.update({
        ...existing,
        isPrimary: false,
      });
    }

    const updated = await this.repository.update({
      ...newPrimary,
      isPrimary: true,
    });

    this.eventBus.emit("AssetPrimaryReplaced", new AssetPrimaryReplaced(
      command.restaurantId,
      newPrimary.type.value,
      previousPrimaryId,
      command.id,
    ));

    return AssetMapper.toDTO(updated);
  }

  private async authorize(auth: AuthorizationContext, permission: AssetPermission): Promise<void> {
    await this.authorizationService.authorize(auth, permission);
  }
}
