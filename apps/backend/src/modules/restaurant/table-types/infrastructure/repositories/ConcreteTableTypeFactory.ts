import { randomUUID } from "node:crypto";
import type { TableType } from "../../domain/models/TableType.js";
import type { TableTypeFactory, CreateTableTypeData, ReconstituteTableTypeData } from "../../domain/repositories/TableTypeFactory.js";
import { TableTypeName } from "../../domain/models/TableTypeName.js";
import { TableTypeCode } from "../../domain/models/TableTypeCode.js";
import { TableCapacity } from "../../domain/models/TableCapacity.js";
import { TableShape } from "../../domain/models/TableShape.js";
import { DisplayOrder } from "../../domain/models/DisplayOrder.js";
import { TableTypeStatus } from "../../domain/models/TableTypeStatus.js";

export class ConcreteTableTypeFactory implements TableTypeFactory {
  create(data: CreateTableTypeData): TableType {
    const now = new Date();
    return {
      id: randomUUID(),
      restaurantId: data.restaurantId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      defaultCapacity: data.defaultCapacity,
      minimumCapacity: data.minimumCapacity,
      maximumCapacity: data.maximumCapacity,
      shape: data.shape,
      isReservable: data.isReservable ?? true,
      displayOrder: data.displayOrder,
      status: data.status ?? TableTypeStatus.create("active"),
      metadata: data.metadata ?? null,
      createdAt: now,
      updatedAt: now,
    };
  }

  reconstitute(data: ReconstituteTableTypeData): TableType {
    return {
      id: data.id,
      restaurantId: data.restaurantId,
      name: TableTypeName.reconstitute(data.name),
      code: TableTypeCode.reconstitute(data.code),
      description: data.description,
      defaultCapacity: TableCapacity.reconstitute(data.defaultCapacity),
      minimumCapacity: TableCapacity.reconstitute(data.minimumCapacity),
      maximumCapacity: TableCapacity.reconstitute(data.maximumCapacity),
      shape: TableShape.reconstitute(data.shape),
      isReservable: data.isReservable,
      displayOrder: DisplayOrder.reconstitute(data.displayOrder),
      status: TableTypeStatus.reconstitute(data.status),
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
