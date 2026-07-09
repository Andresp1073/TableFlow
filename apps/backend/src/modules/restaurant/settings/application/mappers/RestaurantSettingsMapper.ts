import type { RestaurantSettings } from "../../domain/models/RestaurantSettings.js";
import type { RestaurantSettingsDTO } from "../dtos/RestaurantSettingsDTO.js";

export class RestaurantSettingsMapper {
  static toDTO(settings: RestaurantSettings): RestaurantSettingsDTO {
    return {
      id: settings.id,
      restaurantId: settings.restaurantId,
      timezone: settings.timezone.value,
      currency: settings.currency.value,
      language: settings.language.value,
      dateFormat: settings.dateFormat.value,
      timeFormat: settings.timeFormat.value,
      weekStartsOn: settings.weekStartsOn,
      taxPercentage: settings.taxPercentage.value,
      serviceChargePercentage: settings.serviceChargePercentage.value,
      defaultReservationDuration: settings.defaultReservationDuration.value,
      reservationBufferMinutes: settings.reservationBufferMinutes.value,
      allowWalkIns: settings.allowWalkIns,
      autoConfirmReservations: settings.autoConfirmReservations,
      maxReservationsPerCustomer: settings.maxReservationsPerCustomer,
      reservationCancellationHours: settings.reservationCancellationHours,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }
}
