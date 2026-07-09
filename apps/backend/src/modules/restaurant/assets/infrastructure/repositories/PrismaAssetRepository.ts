import type { PrismaClient } from "@prisma/client";
import type { RestaurantAsset } from "../../domain/models/RestaurantAsset.js";
import type { AssetRepository } from "../../domain/repositories/AssetRepository.js";
import type { AssetFactory } from "../../domain/repositories/AssetFactory.js";

export class PrismaAssetRepository implements AssetRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly factory: AssetFactory,
  ) {}

  async findById(id: string): Promise<RestaurantAsset | null> {
    const record = await this.prisma.restaurantAsset.findUnique({ where: { id } });
    if (!record) return null;
    return this.factory.reconstitute(record as never);
  }

  async findByRestaurantId(restaurantId: string): Promise<RestaurantAsset[]> {
    const records = await this.prisma.restaurantAsset.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.factory.reconstitute(r as never));
  }

  async findByRestaurantIdAndType(restaurantId: string, type: string): Promise<RestaurantAsset[]> {
    const records = await this.prisma.restaurantAsset.findMany({
      where: { restaurantId, type },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.factory.reconstitute(r as never));
  }

  async findPrimaryByRestaurantIdAndType(restaurantId: string, type: string): Promise<RestaurantAsset | null> {
    const record = await this.prisma.restaurantAsset.findFirst({
      where: { restaurantId, type, isPrimary: true },
    });
    if (!record) return null;
    return this.factory.reconstitute(record as never);
  }

  async save(asset: RestaurantAsset): Promise<RestaurantAsset> {
    const data = {
      id: asset.id,
      restaurantId: asset.restaurantId,
      type: asset.type.value,
      name: asset.name,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType.value,
      extension: asset.extension,
      size: asset.size,
      width: asset.width,
      height: asset.height,
      storageProvider: asset.storageProvider,
      storageKey: asset.storageKey.value,
      publicUrl: asset.publicUrl,
      isPrimary: asset.isPrimary,
      metadata: (asset.metadata ?? undefined) as Record<string, unknown> | undefined,
    };

    await this.prisma.restaurantAsset.create({ data: data as never });
    return asset;
  }

  async update(asset: RestaurantAsset): Promise<RestaurantAsset> {
    const data = {
      type: asset.type.value,
      name: asset.name,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType.value,
      extension: asset.extension,
      size: asset.size,
      width: asset.width,
      height: asset.height,
      storageProvider: asset.storageProvider,
      storageKey: asset.storageKey.value,
      publicUrl: asset.publicUrl,
      isPrimary: asset.isPrimary,
      metadata: (asset.metadata ?? undefined) as Record<string, unknown> | undefined,
    };

    await this.prisma.restaurantAsset.update({
      where: { id: asset.id },
      data: data as never,
    });

    return asset;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.restaurantAsset.delete({ where: { id } });
  }

  async countByRestaurantIdAndType(restaurantId: string, type: string): Promise<number> {
    return this.prisma.restaurantAsset.count({
      where: { restaurantId, type },
    });
  }
}
