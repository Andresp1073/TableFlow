import { PrismaClient } from "@prisma/client";
import type { TableType } from "../../domain/models/TableType.js";
import type { TableTypeRepository } from "../../domain/repositories/TableTypeRepository.js";
import { ConcreteTableTypeFactory } from "./ConcreteTableTypeFactory.js";

export class PrismaTableTypeRepository implements TableTypeRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly factory: ConcreteTableTypeFactory,
  ) {}

  async save(type: TableType): Promise<TableType> {
    const record = await this.prisma.tableType.create({
      data: {
        id: type.id,
        restaurantId: type.restaurantId,
        name: type.name.value,
        code: type.code.value,
        description: type.description,
        defaultCapacity: type.defaultCapacity.value,
        minimumCapacity: type.minimumCapacity.value,
        maximumCapacity: type.maximumCapacity.value,
        shape: type.shape.value,
        isReservable: type.isReservable,
        displayOrder: type.displayOrder.value,
        status: type.status.value,
        metadata: type.metadata as object | null,
      },
    });
    return this.reconstitute(record);
  }

  async update(type: TableType): Promise<TableType> {
    const record = await this.prisma.tableType.update({
      where: { id: type.id },
      data: {
        name: type.name.value,
        code: type.code.value,
        description: type.description,
        defaultCapacity: type.defaultCapacity.value,
        minimumCapacity: type.minimumCapacity.value,
        maximumCapacity: type.maximumCapacity.value,
        shape: type.shape.value,
        isReservable: type.isReservable,
        displayOrder: type.displayOrder.value,
        status: type.status.value,
        metadata: type.metadata as object | null,
      },
    });
    return this.reconstitute(record);
  }

  async findById(id: string): Promise<TableType | null> {
    const record = await this.prisma.tableType.findUnique({ where: { id } });
    if (!record) return null;
    return this.reconstitute(record);
  }

  async findByIdAndRestaurant(id: string, restaurantId: string): Promise<TableType | null> {
    const record = await this.prisma.tableType.findUnique({
      where: { id },
    });
    if (!record || record.restaurantId !== restaurantId) return null;
    return this.reconstitute(record);
  }

  async findByRestaurantId(restaurantId: string): Promise<TableType[]> {
    const records = await this.prisma.tableType.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: "asc" },
    });
    return records.map((r) => this.reconstitute(r));
  }

  async findByNameAndRestaurant(name: string, restaurantId: string): Promise<TableType | null> {
    const record = await this.prisma.tableType.findFirst({
      where: { name, restaurantId },
    });
    if (!record) return null;
    return this.reconstitute(record);
  }

  async findByCodeAndRestaurant(code: string, restaurantId: string): Promise<TableType | null> {
    const record = await this.prisma.tableType.findFirst({
      where: { code, restaurantId },
    });
    if (!record) return null;
    return this.reconstitute(record);
  }

  async findMaxDisplayOrder(restaurantId: string): Promise<number> {
    const result = await this.prisma.tableType.aggregate({
      where: { restaurantId },
      _max: { displayOrder: true },
    });
    return result._max.displayOrder ?? 0;
  }

  private reconstitute(record: {
    id: string;
    restaurantId: string;
    name: string;
    code: string;
    description: string | null;
    defaultCapacity: number;
    minimumCapacity: number;
    maximumCapacity: number;
    shape: string;
    isReservable: boolean;
    displayOrder: number;
    status: string;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
  }): TableType {
    return this.factory.reconstitute({
      id: record.id,
      restaurantId: record.restaurantId,
      name: record.name,
      code: record.code,
      description: record.description,
      defaultCapacity: record.defaultCapacity,
      minimumCapacity: record.minimumCapacity,
      maximumCapacity: record.maximumCapacity,
      shape: record.shape,
      isReservable: record.isReservable,
      displayOrder: record.displayOrder,
      status: record.status,
      metadata: record.metadata as Record<string, unknown> | null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
