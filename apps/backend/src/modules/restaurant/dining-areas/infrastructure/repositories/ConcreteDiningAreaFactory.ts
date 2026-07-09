import { randomUUID } from "node:crypto";
import type { DiningArea } from "../../domain/models/DiningArea.js";
import type { DiningAreaFactory, CreateDiningAreaData, ReconstituteDiningAreaData } from "../../domain/repositories/DiningAreaFactory.js";
import { DiningAreaName } from "../../domain/models/DiningAreaName.js";
import { DiningAreaCode } from "../../domain/models/DiningAreaCode.js";
import { DisplayOrder } from "../../domain/models/DisplayOrder.js";
import { DiningAreaStatus } from "../../domain/models/DiningAreaStatus.js";

export class ConcreteDiningAreaFactory implements DiningAreaFactory {
  create(data: CreateDiningAreaData): DiningArea {
    const now = new Date();
    return {
      id: randomUUID(),
      restaurantId: data.restaurantId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      displayOrder: data.displayOrder,
      status: data.status ?? DiningAreaStatus.create("active"),
      isReservable: data.isReservable ?? true,
      createdAt: now,
      updatedAt: now,
    };
  }

  reconstitute(data: ReconstituteDiningAreaData): DiningArea {
    return {
      id: data.id,
      restaurantId: data.restaurantId,
      name: DiningAreaName.reconstitute(data.name),
      code: DiningAreaCode.reconstitute(data.code),
      description: data.description,
      displayOrder: DisplayOrder.reconstitute(data.displayOrder),
      status: DiningAreaStatus.reconstitute(data.status),
      isReservable: data.isReservable,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
