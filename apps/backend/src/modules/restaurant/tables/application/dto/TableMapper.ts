import type { Table } from "../../domain/models/Table.js";
import type { TableDTO } from "./TableDTO.js";

export class TableMapper {
  static toDTO(table: Table): TableDTO {
    return {
      id: table.id,
      restaurantId: table.restaurantId,
      branchId: table.branchId,
      diningAreaId: table.diningAreaId,
      tableTypeId: table.tableTypeId,
      tableNumber: table.tableNumber.value,
      name: table.name?.value ?? null,
      description: table.description,
      minimumCapacity: table.minimumCapacity.value,
      maximumCapacity: table.maximumCapacity.value,
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
      metadata: table.metadata,
      createdAt: table.createdAt.toISOString(),
      updatedAt: table.updatedAt.toISOString(),
      deletedAt: table.deletedAt?.toISOString() ?? null,
    };
  }

  static toDTOList(tables: Table[]): TableDTO[] {
    return tables.map((t) => this.toDTO(t));
  }
}
