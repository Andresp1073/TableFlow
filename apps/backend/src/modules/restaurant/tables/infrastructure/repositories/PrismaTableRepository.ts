import { PrismaClient } from "@prisma/client";
import type { Table } from "../../domain/models/Table.js";
import type { TableRepository, TableListFilters } from "../../domain/repositories/TableRepository.js";
import { ConcreteTableFactory } from "./ConcreteTableFactory.js";

export class PrismaTableRepository implements TableRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly factory: ConcreteTableFactory,
  ) {}

  async save(table: Table): Promise<Table> {
    const record = await this.prisma.restaurantTable.create({
      data: {
        id: table.id,
        restaurantId: table.restaurantId,
        branchId: table.branchId,
        diningAreaId: table.diningAreaId,
        tableTypeId: table.tableTypeId,
        tableNumber: table.tableNumber.value,
        name: table.name?.value ?? null,
        description: table.description,
        minCapacity: table.minimumCapacity.value,
        maxCapacity: table.maximumCapacity.value,
        currentCapacity: table.currentCapacity.value,
        shape: table.shape,
        width: table.width,
        height: table.height,
        positionX: table.position?.x ?? null,
        positionY: table.position?.y ?? null,
        rotation: table.rotation?.value ?? null,
        qrIdentifier: table.qrIdentifier?.value ?? null,
        isReservable: table.isReservable,
        isAccessible: table.isAccessible,
        isActive: table.isActive,
        status: table.status.value,
        metadata: table.metadata as object | null,
      },
    });
    return this.reconstitute(record);
  }

  async update(table: Table): Promise<Table> {
    const record = await this.prisma.restaurantTable.update({
      where: { id: table.id },
      data: {
        branchId: table.branchId,
        diningAreaId: table.diningAreaId,
        tableTypeId: table.tableTypeId,
        tableNumber: table.tableNumber.value,
        name: table.name?.value ?? null,
        description: table.description,
        minCapacity: table.minimumCapacity.value,
        maxCapacity: table.maximumCapacity.value,
        currentCapacity: table.currentCapacity.value,
        shape: table.shape,
        width: table.width,
        height: table.height,
        positionX: table.position?.x ?? null,
        positionY: table.position?.y ?? null,
        rotation: table.rotation?.value ?? null,
        qrIdentifier: table.qrIdentifier?.value ?? null,
        isReservable: table.isReservable,
        isAccessible: table.isAccessible,
        isActive: table.isActive,
        status: table.status.value,
        metadata: table.metadata as object | null,
        deletedAt: table.deletedAt,
      },
    });
    return this.reconstitute(record);
  }

  async findById(id: string): Promise<Table | null> {
    const record = await this.prisma.restaurantTable.findUnique({ where: { id } });
    if (!record) return null;
    return this.reconstitute(record);
  }

  async findByIdAndRestaurant(id: string, restaurantId: string): Promise<Table | null> {
    const record = await this.prisma.restaurantTable.findUnique({
      where: { id },
    });
    if (!record || record.restaurantId !== restaurantId) return null;
    return this.reconstitute(record);
  }

  async findByRestaurantId(restaurantId: string): Promise<Table[]> {
    const records = await this.prisma.restaurantTable.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: "asc" },
    });
    return records.map((r) => this.reconstitute(r));
  }

  async findByFilters(filters: TableListFilters): Promise<Table[]> {
    const where: Record<string, unknown> = { restaurantId: filters.restaurantId };

    if (filters.diningAreaId) where.diningAreaId = filters.diningAreaId;
    if (filters.tableTypeId) where.tableTypeId = filters.tableTypeId;
    if (filters.status) where.status = filters.status;
    if (filters.isReservable !== undefined) where.isReservable = filters.isReservable;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.minCapacity !== undefined) {
      where.maxCapacity = { gte: filters.minCapacity };
    }

    const records = await this.prisma.restaurantTable.findMany({
      where: where as never,
      orderBy: { tableNumber: "asc" },
    });
    return records.map((r) => this.reconstitute(r));
  }

  async findByNumberAndRestaurant(tableNumber: string, restaurantId: string): Promise<Table | null> {
    const record = await this.prisma.restaurantTable.findFirst({
      where: { tableNumber, restaurantId },
    });
    if (!record) return null;
    return this.reconstitute(record);
  }

  async findByNameAndRestaurant(name: string, restaurantId: string): Promise<Table | null> {
    const record = await this.prisma.restaurantTable.findFirst({
      where: { name, restaurantId },
    });
    if (!record) return null;
    return this.reconstitute(record);
  }

  async findByQrIdentifier(qrIdentifier: string, restaurantId: string): Promise<Table | null> {
    const record = await this.prisma.restaurantTable.findFirst({
      where: { qrIdentifier, restaurantId },
    });
    if (!record) return null;
    return this.reconstitute(record);
  }

  async countByDiningArea(diningAreaId: string): Promise<number> {
    return this.prisma.restaurantTable.count({
      where: { diningAreaId, deletedAt: null },
    });
  }

  async countByTableType(tableTypeId: string): Promise<number> {
    return this.prisma.restaurantTable.count({
      where: { tableTypeId, deletedAt: null },
    });
  }

  private reconstitute(record: {
    id: string;
    restaurantId: string;
    branchId: string;
    diningAreaId: string | null;
    tableTypeId: string | null;
    tableNumber: string;
    name: string | null;
    description: string | null;
    minCapacity: number;
    maxCapacity: number;
    currentCapacity: number;
    shape: string;
    width: number;
    height: number;
    positionX: number | null;
    positionY: number | null;
    rotation: number | null;
    qrIdentifier: string | null;
    isReservable: boolean;
    isAccessible: boolean;
    isActive: boolean;
    status: string;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Table {
    return this.factory.reconstitute({
      id: record.id,
      restaurantId: record.restaurantId,
      branchId: record.branchId,
      diningAreaId: record.diningAreaId,
      tableTypeId: record.tableTypeId,
      tableNumber: record.tableNumber,
      name: record.name,
      description: record.description,
      minimumCapacity: record.minCapacity,
      maximumCapacity: record.maxCapacity,
      currentCapacity: record.currentCapacity,
      shape: record.shape,
      width: record.width,
      height: record.height,
      positionX: record.positionX,
      positionY: record.positionY,
      rotation: record.rotation,
      qrIdentifier: record.qrIdentifier,
      isReservable: record.isReservable,
      isAccessible: record.isAccessible,
      isActive: record.isActive,
      status: record.status,
      metadata: record.metadata as Record<string, unknown> | null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    });
  }
}
