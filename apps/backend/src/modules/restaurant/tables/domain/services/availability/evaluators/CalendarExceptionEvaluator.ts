import type { AvailabilityEvaluator } from "../AvailabilityEvaluator.js";
import type { AvailabilityContext } from "../AvailabilityContext.js";
import type { AvailabilityResult } from "../AvailabilityResult.js";
import { unavailable, available } from "../AvailabilityResult.js";
import type { CalendarException } from "../../../../calendar-exceptions/domain/models/CalendarException.js";

export interface CalendarExceptionRepository {
  findByRestaurantIdAndDate(restaurantId: string, date: string): Promise<CalendarException[]>;
}

export class CalendarExceptionEvaluator implements AvailabilityEvaluator {
  readonly name = "calendar_exception";

  constructor(private readonly repository: CalendarExceptionRepository) {}

  async evaluate(context: AvailabilityContext): Promise<AvailabilityResult> {
    const { restaurantId, date, time } = context;

    if (!date) {
      return available();
    }

    const exceptions = await this.repository.findByRestaurantIdAndDate(restaurantId, date);

    for (const exception of exceptions) {
      if (exception.isClosed) {
        if (exception.type.value === "holiday") {
          return unavailable("holiday", { title: exception.title, date });
        }
        if (exception.type.value === "temporary_closure") {
          return unavailable("special_closure", { title: exception.title, date });
        }
        if (exception.type.value === "emergency_closure") {
          return unavailable("emergency_closure", { title: exception.title, date });
        }
        if (exception.type.value === "maintenance") {
          return unavailable("maintenance_closure", { title: exception.title, date });
        }
      }

      if (exception.allDay && !exception.isClosed) {
        return available();
      }

      if (!exception.isClosed && exception.openTime && exception.closeTime && time) {
        const openMinutes = this.parseTimeToMinutes(exception.openTime);
        const closeMinutes = this.parseTimeToMinutes(exception.closeTime);
        const timeMinutes = this.parseTimeToMinutes(time);

        if (openMinutes !== null && closeMinutes !== null && timeMinutes !== null) {
          if (timeMinutes >= openMinutes && timeMinutes < closeMinutes) {
            return available();
          }
        }
      }
    }

    return available();
  }

  private parseTimeToMinutes(time: string): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(time);
    if (!match) return null;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
}
