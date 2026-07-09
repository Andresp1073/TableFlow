import { randomUUID } from "node:crypto";
import type { BusinessHours } from "../../domain/models/BusinessHours.js";
import type { BusinessHoursFactory, CreateBusinessHoursData, ReconstituteBusinessHoursData } from "../../domain/repositories/BusinessHoursFactory.js";
import { DayOfWeek } from "../../domain/models/DayOfWeek.js";
import { OpeningPeriod } from "../../domain/models/OpeningPeriod.js";
import { DaySchedule } from "../../domain/models/DaySchedule.js";

export class ConcreteBusinessHoursFactory implements BusinessHoursFactory {
  create(data: CreateBusinessHoursData): BusinessHours {
    return {
      id: randomUUID(),
      restaurantId: data.restaurantId,
      schedules: data.schedules,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  reconstitute(data: ReconstituteBusinessHoursData): BusinessHours {
    const schedules = data.schedules.map((s) =>
      DaySchedule.reconstitute(s.dayOfWeek, s.isClosed, s.periods),
    );
    return {
      id: data.id,
      restaurantId: data.restaurantId,
      schedules,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
