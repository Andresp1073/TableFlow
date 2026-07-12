import type { AvailabilityEvaluator } from "../AvailabilityEvaluator.js";
import type { AvailabilityContext } from "../AvailabilityContext.js";
import type { AvailabilityResult } from "../AvailabilityResult.js";
import { unavailable, available } from "../AvailabilityResult.js";
import type { BusinessHours } from "../../../../business-hours/domain/models/BusinessHours.js";

export interface BusinessHoursRepository {
  findByRestaurantId(restaurantId: string): Promise<BusinessHours | null>;
}

export class BusinessHoursEvaluator implements AvailabilityEvaluator {
  readonly name = "business_hours";

  constructor(private readonly repository: BusinessHoursRepository) {}

  async evaluate(context: AvailabilityContext): Promise<AvailabilityResult> {
    const { restaurantId, date, time } = context;

    if (!date) {
      return unavailable("unknown", { message: "Date is required for business hours check" });
    }

    const dayOfWeek = new Date(date + "T00:00:00Z").getUTCDay() || 7;

    const businessHours = await this.repository.findByRestaurantId(restaurantId);
    if (!businessHours) {
      return available();
    }

    const schedule = businessHours.schedules.find((s) => s.dayOfWeek.value === dayOfWeek);
    if (!schedule) {
      return unavailable("outside_business_hours", { dayOfWeek });
    }

    if (schedule.isClosed) {
      return unavailable("restaurant_closed", { dayOfWeek });
    }

    if (time && schedule.periods.length > 0) {
      const timeMinutes = this.parseTimeToMinutes(time);
      if (timeMinutes === null) {
        return unavailable("unknown", { message: `Invalid time format: ${time}` });
      }

      const inAnyPeriod = schedule.periods.some((period) => {
        const openMin = period.openTime.value;
        const closeMin = period.closeTime.value;
        return timeMinutes >= openMin && timeMinutes < closeMin;
      });

      if (!inAnyPeriod) {
        return unavailable("outside_business_hours", {
          dayOfWeek,
          requestedTime: time,
        });
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
