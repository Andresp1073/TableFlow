import type { TableType } from "../../domain/models/TableType.js";
import type { TableTypeDTO } from "./TableTypeDTO.js";

export class TableTypeMapper {
  static toDTO(type: TableType): TableTypeDTO {
    return {
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
      metadata: type.metadata,
      createdAt: type.createdAt.toISOString(),
      updatedAt: type.updatedAt.toISOString(),
    };
  }

  static toDTOList(types: TableType[]): TableTypeDTO[] {
    return types.map((t) => this.toDTO(t));
  }
}
