import { PrismaClient, Prisma } from "@prisma/client";
import type { AuditEntry } from "../../domain/models/AuditEntry.js";
import type { AuditRepository, AuditSearchCriteria, PaginatedResult } from "../../domain/repositories/AuditRepository.js";
import { ConcreteAuditFactory } from "./ConcreteAuditFactory.js";

export class PrismaAuditRepository implements AuditRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly factory: ConcreteAuditFactory,
  ) {}

  async save(entry: AuditEntry): Promise<AuditEntry> {
    const record = await this.prisma.auditEntry.create({
      data: {
        id: entry.id,
        organizationId: entry.organizationId,
        module: entry.module.value,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action.value,
        performedBy: entry.performedBy,
        restaurantId: entry.restaurantId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        requestId: entry.requestId,
        oldValues: entry.oldValues as Prisma.InputJsonValue | null,
        newValues: entry.newValues as Prisma.InputJsonValue | null,
        metadata: entry.metadata as Prisma.InputJsonValue | null,
      },
    });
    return this.reconstitute(record);
  }

  async findById(id: string): Promise<AuditEntry | null> {
    const record = await this.prisma.auditEntry.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.reconstitute(record);
  }

  async search(criteria: AuditSearchCriteria): Promise<PaginatedResult<AuditEntry>> {
    const page = criteria.page ?? 1;
    const limit = Math.min(criteria.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      organizationId: criteria.organizationId,
    };

    if (criteria.module) where.module = criteria.module;
    if (criteria.entityType) where.entityType = criteria.entityType;
    if (criteria.entityId) where.entityId = criteria.entityId;
    if (criteria.action) where.action = criteria.action;
    if (criteria.performedBy) where.performedBy = criteria.performedBy;
    if (criteria.restaurantId) where.restaurantId = criteria.restaurantId;
    if (criteria.startDate || criteria.endDate) {
      const createdAt: Record<string, Date> = {};
      if (criteria.startDate) createdAt.gte = new Date(criteria.startDate);
      if (criteria.endDate) createdAt.lte = new Date(criteria.endDate + "T23:59:59.999Z");
      where.createdAt = createdAt;
    }

    const [records, total] = await Promise.all([
      this.prisma.auditEntry.findMany({
        where: where as Prisma.AuditEntryWhereInput,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.auditEntry.count({
        where: where as Prisma.AuditEntryWhereInput,
      }),
    ]);

    return {
      items: records.map((r) => this.reconstitute(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByOrganizationAndDateRange(
    organizationId: string,
    startDate: string,
    endDate: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedResult<AuditEntry>> {
    return this.search({
      organizationId,
      startDate,
      endDate,
      page,
      limit,
    });
  }

  private reconstitute(record: {
    id: string;
    organizationId: string;
    module: string;
    entityType: string;
    entityId: string;
    action: string;
    performedBy: string | null;
    restaurantId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    requestId: string | null;
    oldValues: Prisma.JsonValue | null;
    newValues: Prisma.JsonValue | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
  }): AuditEntry {
    return this.factory.reconstitute({
      id: record.id,
      organizationId: record.organizationId,
      module: record.module,
      entityType: record.entityType,
      entityId: record.entityId,
      action: record.action,
      performedBy: record.performedBy,
      restaurantId: record.restaurantId,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      requestId: record.requestId,
      oldValues: record.oldValues as Record<string, unknown> | null,
      newValues: record.newValues as Record<string, unknown> | null,
      metadata: record.metadata as Record<string, unknown> | null,
      createdAt: record.createdAt,
    });
  }
}
