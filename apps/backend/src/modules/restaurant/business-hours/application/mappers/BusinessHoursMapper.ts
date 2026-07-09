import type { BusinessHours } from "../../domain/models/BusinessHours.js";
import type { BusinessHoursDTO, DayScheduleDTO, OpeningPeriodDTO } from "../dtos/BusinessHoursDTO.js";

export class BusinessHoursMapper {
  static toDTO(businessHours: BusinessHours): BusinessHoursDTO {
    return {
      id: businessHours.id,
      restaurantId: businessHours.restaurantId,
      schedules: businessHours.schedules.map(
        (schedule): DayScheduleDTO => ({
          dayOfWeek: schedule.dayOfWeek.value,
          isClosed: schedule.isClosed,
          periods: schedule.periods.map(
            (period): OpeningPeriodDTO => ({
              openTime: period.openTime.toString(),
              closeTime: period.closeTime.toString(),
              order: period.order,
            }),
          ),
        }),
      ),
      createdAt: businessHours.createdAt.toISOString(),
      updatedAt: businessHours.updatedAt.toISOString(),
    };
  }
}
