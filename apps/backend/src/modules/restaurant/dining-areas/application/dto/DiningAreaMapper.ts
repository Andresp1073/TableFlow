import type { DiningArea } from "../../domain/models/DiningArea.js";
import type { DiningAreaDTO } from "./DiningAreaDTO.js";

export class DiningAreaMapper {
  static toDTO(area: DiningArea): DiningAreaDTO {
    return {
      id: area.id,
      restaurantId: area.restaurantId,
      name: area.name.value,
      code: area.code.value,
      description: area.description,
      displayOrder: area.displayOrder.value,
      status: area.status.value,
      isReservable: area.isReservable,
      createdAt: area.createdAt.toISOString(),
      updatedAt: area.updatedAt.toISOString(),
    };
  }

  static toDTOList(areas: DiningArea[]): DiningAreaDTO[] {
    return areas.map((a) => this.toDTO(a));
  }
}
