import type { DateFormat } from "./DateFormat.js";
import type { TimeFormat } from "./TimeFormat.js";
import type { ReservationDuration } from "./ReservationDuration.js";
import type { TaxPercentage } from "./TaxPercentage.js";
import type { ReservationBufferMinutes } from "./ReservationBufferMinutes.js";
import type { RestaurantTimezone } from "../../../domain/models/RestaurantTimezone.js";
import type { RestaurantCurrency } from "../../../domain/models/RestaurantCurrency.js";
import type { RestaurantLanguage } from "../../../domain/models/RestaurantLanguage.js";

export interface RestaurantSettings {
  id: string;
  restaurantId: string;
  timezone: RestaurantTimezone;
  currency: RestaurantCurrency;
  language: RestaurantLanguage;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  weekStartsOn: number;
  taxPercentage: TaxPercentage;
  serviceChargePercentage: TaxPercentage;
  defaultReservationDuration: ReservationDuration;
  reservationBufferMinutes: ReservationBufferMinutes;
  allowWalkIns: boolean;
  autoConfirmReservations: boolean;
  maxReservationsPerCustomer: number;
  reservationCancellationHours: number;
  createdAt: Date;
  updatedAt: Date;
}
