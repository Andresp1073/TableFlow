import { PrismaClient } from "@prisma/client";
import type { DiningArea } from "../../domain/models/DiningArea.js";
import type { DiningAreaRepository } from "../../domain/repositories/DiningAreaRepository.js";
import { ConcreteDiningAreaFactory } from "./ConcreteDiningAreaFactory.js";

export class PrismaDiningAreaRepository implements DiningAreaRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly factory: ConcreteDiningAreaFactory,
  ) {}

  async save(area: DiningArea): Promise<DiningArea> {
    const record = await this.prisma.diningArea.create({
      data: {
        id: area.id,
        restaurantId: area.restaurantId,
        name: area.name.value,
        code: area.code.value,
        description: area.description,
        displayOrder: area.displayOrder.value,
        status: area.status.value,
        isReservable: area.isReservable,
      },
    });
    return this.reconstitute(record);
  }

  async update(area: DiningArea): Promise<DiningArea> {
    const record = await this.prisma.diningArea.update({
      where: { id: area.id },
      data: {
        name: area.name.value,
        code: area.code.value,
        description: area.description,
        displayOrder: area.displayOrder.value,
        status: area.status.value,
        isReservable: area.isReservable,
      },
    });
    return this.reconstitute(record);
  }

  async findById(id: string): Promise<DiningArea | null> {
    const record = await this.prisma.diningArea.findUnique({ where: { id } });
    if (!record) return null;
    return this.reconstitute(record);
  }

  async findByIdAndRestaurant(id: string, restaurantId: string): Promise<DiningArea | null> {
    const record = await this.prisma.diningArea.findUnique({
      where: { id },
    });
    if (!record || record.restaurantId !== restaurantId) return null;
    return this.reconstitute(record);
  }

  async findByRestaurantId(restaurantId: string): Promise<DiningArea[]> {
    const records = await this.prisma.diningArea.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: "asc" },
    });
    return records.map((r) => this.reconstitute(r));
  }

  async findByNameAndRestaurant(name: string, restaurantId: string): Promise<DiningArea | null> {
    const record = await this.prisma.diningArea.findFirst({
      where: { name, restaurantId },
    });
    if (!record) return null;
    return this.reconstitute(record);
  }

  async findByCodeAndRestaurant(code: string, restaurantId: string): Promise<DiningArea | null> {
    const record = await this.prisma.diningArea.findFirst({
      where: { code, restaurantId },
    });
    if (!record) return null;
    return this.reconstitute(record);
  }

  async findMaxDisplayOrder(restaurantId: string): Promise<number> {
    const result = await this.prisma.diningArea.aggregate({
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
    displayOrder: number;
    status: string;
    isReservable: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): DiningArea {
    return this.factory.reconstitute({
      id: record.id,
      restaurantId: record.restaurantId,
      name: record.name,
      code: record.code,
      description: record.description,
      displayOrder: record.displayOrder,
      status: record.status,
      isReservable: record.isReservable,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
