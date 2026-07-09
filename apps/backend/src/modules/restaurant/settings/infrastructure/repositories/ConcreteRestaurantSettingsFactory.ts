import { randomUUID } from "node:crypto";
import type { RestaurantSettings } from "../../domain/models/RestaurantSettings.js";
import type { RestaurantSettingsFactory, CreateRestaurantSettingsData, ReconstituteRestaurantSettingsData } from "../../domain/repositories/RestaurantSettingsFactory.js";
import { RestaurantTimezone } from "../../../domain/models/RestaurantTimezone.js";
import { RestaurantCurrency } from "../../../domain/models/RestaurantCurrency.js";
import { RestaurantLanguage } from "../../../domain/models/RestaurantLanguage.js";
import { DateFormat } from "../../domain/models/DateFormat.js";
import { TimeFormat } from "../../domain/models/TimeFormat.js";
import { ReservationDuration } from "../../domain/models/ReservationDuration.js";
import { TaxPercentage } from "../../domain/models/TaxPercentage.js";
import { ReservationBufferMinutes } from "../../domain/models/ReservationBufferMinutes.js";

export class ConcreteRestaurantSettingsFactory implements RestaurantSettingsFactory {
  create(data: CreateRestaurantSettingsData): RestaurantSettings {
    return {
      id: randomUUID(),
      restaurantId: data.restaurantId,
      timezone: data.timezone,
      currency: data.currency,
      language: data.language,
      dateFormat: data.dateFormat,
      timeFormat: data.timeFormat,
      weekStartsOn: data.weekStartsOn,
      taxPercentage: data.taxPercentage,
      serviceChargePercentage: data.serviceChargePercentage,
      defaultReservationDuration: data.defaultReservationDuration,
      reservationBufferMinutes: data.reservationBufferMinutes,
      allowWalkIns: data.allowWalkIns,
      autoConfirmReservations: data.autoConfirmReservations,
      maxReservationsPerCustomer: data.maxReservationsPerCustomer,
      reservationCancellationHours: data.reservationCancellationHours,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  reconstitute(data: ReconstituteRestaurantSettingsData): RestaurantSettings {
    return {
      id: data.id,
      restaurantId: data.restaurantId,
      timezone: RestaurantTimezone.reconstitute(data.timezone),
      currency: RestaurantCurrency.reconstitute(data.currency),
      language: RestaurantLanguage.reconstitute(data.language),
      dateFormat: DateFormat.reconstitute(data.dateFormat),
      timeFormat: TimeFormat.reconstitute(data.timeFormat),
      weekStartsOn: data.weekStartsOn,
      taxPercentage: TaxPercentage.reconstitute(data.taxPercentage),
      serviceChargePercentage: TaxPercentage.reconstitute(data.serviceChargePercentage),
      defaultReservationDuration: ReservationDuration.reconstitute(data.defaultReservationDuration),
      reservationBufferMinutes: ReservationBufferMinutes.reconstitute(data.reservationBufferMinutes),
      allowWalkIns: data.allowWalkIns,
      autoConfirmReservations: data.autoConfirmReservations,
      maxReservationsPerCustomer: data.maxReservationsPerCustomer,
      reservationCancellationHours: data.reservationCancellationHours,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
