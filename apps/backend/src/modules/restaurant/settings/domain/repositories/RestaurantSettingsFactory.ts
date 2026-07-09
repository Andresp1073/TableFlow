import type { RestaurantSettings } from "../models/RestaurantSettings.js";
import type { RestaurantTimezone } from "../../../domain/models/RestaurantTimezone.js";
import type { RestaurantCurrency } from "../../../domain/models/RestaurantCurrency.js";
import type { RestaurantLanguage } from "../../../domain/models/RestaurantLanguage.js";
import type { DateFormat } from "../models/DateFormat.js";
import type { TimeFormat } from "../models/TimeFormat.js";
import type { ReservationDuration } from "../models/ReservationDuration.js";
import type { TaxPercentage } from "../models/TaxPercentage.js";
import type { ReservationBufferMinutes } from "../models/ReservationBufferMinutes.js";

export interface CreateRestaurantSettingsData {
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
}

export interface ReconstituteRestaurantSettingsData {
  id: string;
  restaurantId: string;
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  weekStartsOn: number;
  taxPercentage: number;
  serviceChargePercentage: number;
  defaultReservationDuration: number;
  reservationBufferMinutes: number;
  allowWalkIns: boolean;
  autoConfirmReservations: boolean;
  maxReservationsPerCustomer: number;
  reservationCancellationHours: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantSettingsFactory {
  create(data: CreateRestaurantSettingsData): RestaurantSettings;
  reconstitute(data: ReconstituteRestaurantSettingsData): RestaurantSettings;
}
