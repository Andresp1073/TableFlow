import type { CalendarException } from "../../domain/models/CalendarException.js";
import type { CalendarExceptionDTO } from "../dtos/CalendarExceptionDTO.js";

export class CalendarExceptionMapper {
  static toDTO(exception: CalendarException): CalendarExceptionDTO {
    return {
      id: exception.id,
      restaurantId: exception.restaurantId,
      title: exception.title,
      description: exception.description,
      type: exception.type.value,
      date: exception.date.value,
      isClosed: exception.isClosed,
      openTime: exception.openTime,
      closeTime: exception.closeTime,
      allDay: exception.allDay,
      priority: exception.priority.value,
      createdAt: exception.createdAt.toISOString(),
      updatedAt: exception.updatedAt.toISOString(),
    };
  }

  static toDTOList(exceptions: CalendarException[]): CalendarExceptionDTO[] {
    return exceptions.map((e) => this.toDTO(e));
  }
}
