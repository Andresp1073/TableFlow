import type { PrismaClient } from "@prisma/client";
import type { Restaurant } from "../../domain/models/Restaurant.js";
import type { RestaurantRepository } from "../../domain/repositories/RestaurantRepository.js";
import type { UniquenessRepository } from "../../domain/services/RestaurantUniquenessValidator.js";
import { PersistenceMapper, type OrganizationRecord } from "../../application/mappers/PersistenceMapper.js";
import { RestaurantNotFoundError } from "../../errors/RestaurantNotFoundError.js";

export class PrismaRestaurantRepository implements RestaurantRepository, UniquenessRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Restaurant | null> {
    const record = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!record) return null;

    return PersistenceMapper.toDomain(record as OrganizationRecord);
  }

  async findBySlug(slug: string): Promise<Restaurant | null> {
    const record = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (!record) return null;

    return PersistenceMapper.toDomain(record as OrganizationRecord);
  }

  async save(restaurant: Restaurant): Promise<Restaurant> {
    const data = PersistenceMapper.toPersistence(restaurant);

    const record = await this.prisma.organization.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        legalName: data.legalName,
        taxId: data.taxId,
        email: data.email,
        phone: data.phone,
        website: data.website,
        logoUrl: data.logoUrl,
        address: data.address,
        status: data.status,
        timezone: data.timezone,
        currency: data.currency,
        language: data.language,
        isActive: !restaurant.status.isArchived(),
        deletedAt: data.deletedAt,
        deletedBy: data.deletedBy,
      },
    });

    return PersistenceMapper.toDomain(record as OrganizationRecord);
  }

  async update(restaurant: Restaurant): Promise<Restaurant> {
    const existing = await this.findById(restaurant.id);

    if (!existing) {
      throw new RestaurantNotFoundError(restaurant.id);
    }

    const data = PersistenceMapper.toPersistence(restaurant);

    const record = await this.prisma.organization.update({
      where: { id: restaurant.id },
      data: {
        name: data.name,
        slug: data.slug,
        legalName: data.legalName,
        taxId: data.taxId,
        email: data.email,
        phone: data.phone,
        website: data.website,
        logoUrl: data.logoUrl,
        address: data.address,
        status: data.status,
        timezone: data.timezone,
        currency: data.currency,
        language: data.language,
        isActive: !restaurant.status.isArchived(),
        deletedAt: data.deletedAt,
        deletedBy: data.deletedBy,
      },
    });

    return PersistenceMapper.toDomain(record as OrganizationRecord);
  }

  async softDelete(id: string): Promise<void> {
    const existing = await this.findById(id);

    if (!existing) {
      throw new RestaurantNotFoundError(id);
    }

    await this.prisma.organization.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  async isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    return this.existsBySlug(slug, excludeId);
  }

  async isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
    return this.existsByEmail(email, excludeId);
  }

  async isTaxIdTaken(taxId: string, excludeId?: string): Promise<boolean> {
    return this.existsByTaxId(taxId, excludeId);
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const record = await this.prisma.organization.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    return record !== null;
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const record = await this.prisma.organization.findFirst({
      where: {
        email,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    return record !== null;
  }

  async existsByTaxId(taxId: string, excludeId?: string): Promise<boolean> {
    const record = await this.prisma.organization.findFirst({
      where: {
        taxId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    return record !== null;
  }
}
