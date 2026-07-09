import type { PrismaClient } from "@prisma/client";
import type { Restaurant } from "../../domain/models/Restaurant.js";
import type { RestaurantStatusValue } from "../../domain/models/RestaurantStatus.js";
import { RESTAURANT_STATUSES } from "../../domain/models/RestaurantStatus.js";
import type { RestaurantQueryRepository } from "../../domain/repositories/RestaurantQueryRepository.js";
import { PersistenceMapper, type OrganizationRecord } from "../../application/mappers/PersistenceMapper.js";

export interface ListRestaurantsFilters {
  page?: number;
  limit?: number;
  status?: RestaurantStatusValue;
  search?: string;
  sortBy?: "name" | "slug" | "createdAt" | "updatedAt" | "status";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PrismaRestaurantQueryRepository implements RestaurantQueryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAllActive(): Promise<Restaurant[]> {
    const records = await this.prisma.organization.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
    });

    return records.map((r) => PersistenceMapper.toDomain(r as OrganizationRecord));
  }

  async findByStatus(status: RestaurantStatusValue): Promise<Restaurant[]> {
    const records = await this.prisma.organization.findMany({
      where: { status, deletedAt: null },
      orderBy: { name: "asc" },
    });

    return records.map((r) => PersistenceMapper.toDomain(r as OrganizationRecord));
  }

  async searchByName(query: string): Promise<Restaurant[]> {
    const records = await this.prisma.organization.findMany({
      where: {
        deletedAt: null,
        name: { contains: query },
      },
      orderBy: { name: "asc" },
    });

    return records.map((r) => PersistenceMapper.toDomain(r as OrganizationRecord));
  }

  async countByStatus(): Promise<Record<RestaurantStatusValue, number>> {
    const counts: Record<string, number> = {};

    for (const status of RESTAURANT_STATUSES) {
      counts[status] = await this.prisma.organization.count({
        where: { status, deletedAt: null },
      });
    }

    return counts as Record<RestaurantStatusValue, number>;
  }

  async list(filters: ListRestaurantsFilters): Promise<PaginatedResult<Restaurant>> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { slug: { contains: filters.search } },
        { email: { contains: filters.search } },
      ];
    }

    const allowedSortFields = ["name", "slug", "createdAt", "updatedAt", "status"] as const;
    const sortBy = filters.sortBy && allowedSortFields.includes(filters.sortBy) ? filters.sortBy : "createdAt";
    const sortOrder = filters.sortOrder === "asc" ? "asc" : "desc";

    const [records, total] = await Promise.all([
      this.prisma.organization.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.organization.count({ where: where as never }),
    ]);

    return {
      data: records.map((r) => PersistenceMapper.toDomain(r as OrganizationRecord)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
