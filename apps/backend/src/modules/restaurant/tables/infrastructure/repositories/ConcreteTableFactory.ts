import { randomUUID } from "node:crypto";
import type { Table } from "../../domain/models/Table.js";
import type { TableFactory, CreateTableData, ReconstituteTableData } from "../../domain/repositories/TableFactory.js";
import { TableNumber } from "../../domain/models/TableNumber.js";
import { TableName } from "../../domain/models/TableName.js";
import { TableCapacity } from "../../domain/models/TableCapacity.js";
import { TableStatus } from "../../domain/models/TableStatus.js";
import { TablePosition } from "../../domain/models/TablePosition.js";
import { TableRotation } from "../../domain/models/TableRotation.js";
import { QrIdentifier } from "../../domain/models/QrIdentifier.js";

export class ConcreteTableFactory implements TableFactory {
  create(data: CreateTableData): Table {
    const now = new Date();
    return {
      id: randomUUID(),
      restaurantId: data.restaurantId,
      branchId: data.branchId,
      diningAreaId: data.diningAreaId ?? null,
      tableTypeId: data.tableTypeId ?? null,
      tableNumber: data.tableNumber,
      name: data.name ?? null,
      description: data.description ?? null,
      minimumCapacity: data.minimumCapacity,
      maximumCapacity: data.maximumCapacity,
      currentCapacity: data.currentCapacity ?? data.maximumCapacity,
      shape: data.shape ?? "rectangle",
      width: data.width ?? 60,
      height: data.height ?? 60,
      position: data.position ?? null,
      rotation: data.rotation ?? null,
      qrIdentifier: data.qrIdentifier ?? null,
      isReservable: data.isReservable ?? true,
      isAccessible: data.isAccessible ?? true,
      isActive: data.isActive ?? true,
      status: data.status ?? TableStatus.create("available"),
      metadata: data.metadata ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  }

  reconstitute(data: ReconstituteTableData): Table {
    return {
      id: data.id,
      restaurantId: data.restaurantId,
      branchId: data.branchId,
      diningAreaId: data.diningAreaId,
      tableTypeId: data.tableTypeId,
      tableNumber: TableNumber.reconstitute(data.tableNumber),
      name: data.name ? TableName.reconstitute(data.name) : null,
      description: data.description,
      minimumCapacity: TableCapacity.reconstitute(data.minimumCapacity),
      maximumCapacity: TableCapacity.reconstitute(data.maximumCapacity),
      currentCapacity: TableCapacity.reconstitute(data.currentCapacity),
      shape: data.shape,
      width: data.width,
      height: data.height,
      position: data.positionX !== null && data.positionY !== null
        ? TablePosition.reconstitute(data.positionX, data.positionY)
        : null,
      rotation: data.rotation !== null ? TableRotation.reconstitute(data.rotation) : null,
      qrIdentifier: data.qrIdentifier ? QrIdentifier.reconstitute(data.qrIdentifier) : null,
      isReservable: data.isReservable,
      isAccessible: data.isAccessible,
      isActive: data.isActive,
      status: TableStatus.reconstitute(data.status),
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    };
  }
}
