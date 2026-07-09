import type { Restaurant } from "../../../domain/models/Restaurant.js";
import type { RestaurantSettings } from "../../../settings/domain/models/RestaurantSettings.js";
import type { ReservationPolicy } from "../../../reservation-policy/domain/models/ReservationPolicy.js";
import type { BusinessHours } from "../../../business-hours/domain/models/BusinessHours.js";
import type { CalendarException } from "../../../calendar-exceptions/domain/models/CalendarException.js";
import type { RestaurantRepository } from "../../../domain/repositories/RestaurantRepository.js";
import type { RestaurantSettingsRepository } from "../../../settings/domain/repositories/RestaurantSettingsRepository.js";
import type { ReservationPolicyRepository } from "../../../reservation-policy/domain/repositories/ReservationPolicyRepository.js";
import type { BusinessHoursRepository } from "../../../business-hours/domain/repositories/BusinessHoursRepository.js";
import type { CalendarExceptionRepository } from "../../../calendar-exceptions/domain/repositories/CalendarExceptionRepository.js";
import { InactiveRestaurantError } from "../../errors/InactiveRestaurantError.js";
import { RestaurantNotFoundError } from "../../../errors/RestaurantNotFoundError.js";

export interface ResolvedConfiguration {
  restaurant: Restaurant;
  settings: RestaurantSettings | null;
  reservationPolicy: ReservationPolicy | null;
  businessHours: BusinessHours | null;
  calendarExceptions: CalendarException[];
}

export class RestaurantConfigurationResolver {
  constructor(
    private readonly restaurantRepository: RestaurantRepository,
    private readonly settingsRepository: RestaurantSettingsRepository,
    private readonly policyRepository: ReservationPolicyRepository,
    private readonly businessHoursRepository: BusinessHoursRepository,
    private readonly calendarExceptionRepository: CalendarExceptionRepository,
  ) {}

  async resolve(restaurantId: string): Promise<ResolvedConfiguration> {
    const restaurant = await this.restaurantRepository.findById(restaurantId);

    if (!restaurant) {
      throw new RestaurantNotFoundError(restaurantId);
    }

    if (restaurant.deletedAt) {
      throw new RestaurantNotFoundError(restaurantId);
    }

    if (restaurant.status.isArchived()) {
      throw new InactiveRestaurantError(restaurantId, restaurant.status.value);
    }

    const [settings, reservationPolicy, businessHours, calendarExceptions] = await Promise.all([
      this.settingsRepository.findByRestaurantId(restaurantId),
      this.policyRepository.findByRestaurantId(restaurantId),
      this.businessHoursRepository.findByRestaurantId(restaurantId),
      this.calendarExceptionRepository.findByRestaurantId(restaurantId),
    ]);

    return {
      restaurant,
      settings,
      reservationPolicy,
      businessHours,
      calendarExceptions,
    };
  }
}
