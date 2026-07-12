import type { PrismaClient } from "@prisma/client";
import type { TableGroup } from "../../domain/models/TableGroup.js";
import type { TableGroupRepository, TableGroupListFilters } from "../../domain/repositories/TableGroupRepository.js";
import type { ConcreteTableGroupFactory } from "./ConcreteTableGroupFactory.js";

const ACTIVE_STATUSES = ["active", "reserved", "occupied"];

interface PrismaTableGroupRecord {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  status: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  releasedAt: Date | null;
  members?: PrismaTableGroupMemberRecord[];
}

interface PrismaTableGroupMemberRecord {
  id: string;
  tableGroupId: string;
  tableId: string;
  displayOrder: number;
  joinedAt: Date;
}

export class PrismaTableGroupRepository implements TableGroupRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly factory: ConcreteTableGroupFactory,
  ) {}

  async save(group: TableGroup): Promise<TableGroup> {
    const created = await this.prisma.tableGroup.create({
      data: {
        id: group.id.value,
        restaurantId: group.restaurantId,
        name: group.name.value,
        description: group.description,
        status: group.status.value,
        isActive: group.isActive,
        createdBy: group.createdBy,
        members: {
          create: group.members.map((m) => ({
            tableId: m.tableId,
            displayOrder: m.displayOrder.value,
            joinedAt: m.joinedAt,
          })),
        },
      },
      include: { members: true },
    });

    return this.reconstitute(created);
  }

  async update(group: TableGroup): Promise<TableGroup> {
    await this.prisma.tableGroupMember.deleteMany({
      where: { tableGroupId: group.id.value },
    });

    const updated = await this.prisma.tableGroup.update({
      where: { id: group.id.value },
      data: {
        name: group.name.value,
        description: group.description,
        status: group.status.value,
        isActive: group.isActive,
        releasedAt: group.releasedAt,
        members: {
          create: group.members.map((m) => ({
            tableId: m.tableId,
            displayOrder: m.displayOrder.value,
            joinedAt: m.joinedAt,
          })),
        },
      },
      include: { members: true },
    });

    return this.reconstitute(updated);
  }

  async findById(id: string): Promise<TableGroup | null> {
    const record = await this.prisma.tableGroup.findUnique({
      where: { id },
      include: { members: { orderBy: { displayOrder: "asc" } } },
    });

    return record ? this.reconstitute(record) : null;
  }

  async findByIdAndRestaurant(id: string, restaurantId: string): Promise<TableGroup | null> {
    const record = await this.prisma.tableGroup.findFirst({
      where: { id, restaurantId },
      include: { members: { orderBy: { displayOrder: "asc" } } },
    });

    return record ? this.reconstitute(record) : null;
  }

  async findByRestaurantId(restaurantId: string): Promise<TableGroup[]> {
    const records = await this.prisma.tableGroup.findMany({
      where: { restaurantId },
      include: { members: { orderBy: { displayOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return records.map((r) => this.reconstitute(r));
  }

  async findByFilters(filters: TableGroupListFilters): Promise<TableGroup[]> {
    const where: Record<string, unknown> = { restaurantId: filters.restaurantId };

    if (filters.status) {
      where.status = filters.status;
    }

    const records = await this.prisma.tableGroup.findMany({
      where,
      include: { members: { orderBy: { displayOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return records.map((r) => this.reconstitute(r));
  }

  async findActiveGroupTableIds(restaurantId: string): Promise<string[]> {
    const groups = await this.prisma.tableGroup.findMany({
      where: {
        restaurantId,
        status: { in: ACTIVE_STATUSES },
      },
      include: { members: true },
    });

    return groups.flatMap((g) => g.members.map((m) => m.tableId));
  }

  async findActiveGroupByTableId(tableId: string): Promise<TableGroup | null> {
    const member = await this.prisma.tableGroupMember.findFirst({
      where: { tableId },
      include: {
        tableGroup: {
          include: { members: { orderBy: { displayOrder: "asc" } } },
        },
      },
    });

    if (!member) return null;

    const group = member.tableGroup;
    if (!ACTIVE_STATUSES.includes(group.status)) return null;

    return this.reconstitute(group as unknown as PrismaTableGroupRecord);
  }

  private reconstitute(record: PrismaTableGroupRecord): TableGroup {
    return this.factory.reconstitute({
      id: record.id,
      restaurantId: record.restaurantId,
      name: record.name,
      description: record.description,
      status: record.status,
      isActive: record.isActive,
      createdBy: record.createdBy,
      members: (record.members ?? []).map((m) => ({
        tableId: m.tableId,
        displayOrder: m.displayOrder,
        joinedAt: m.joinedAt,
      })),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      releasedAt: record.releasedAt,
    });
  }
}
