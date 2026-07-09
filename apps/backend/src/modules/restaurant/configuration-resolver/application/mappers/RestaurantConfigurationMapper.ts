import type { Restaurant } from "../../../domain/models/Restaurant.js";
import type { RestaurantSettings } from "../../../settings/domain/models/RestaurantSettings.js";
import type { ReservationPolicy } from "../../../reservation-policy/domain/models/ReservationPolicy.js";
import type { BusinessHours } from "../../../business-hours/domain/models/BusinessHours.js";
import type { CalendarException } from "../../../calendar-exceptions/domain/models/CalendarException.js";
import type { RestaurantConfigurationDTO, RestaurantInfoDTO } from "../dtos/RestaurantConfigurationDTO.js";
import type { ResolvedConfiguration } from "../services/RestaurantConfigurationResolver.js";

function mapRestaurantInfo(restaurant: Restaurant): RestaurantInfoDTO {
  return {
    id: restaurant.id,
    name: restaurant.name.value,
    slug: restaurant.slug.value,
    status: restaurant.status.value,
    timezone: restaurant.timezone.value,
    currency: restaurant.currency.value,
    language: restaurant.language.value,
    isActive: !restaurant.status.isArchived() && restaurant.deletedAt === null,
  };
}

function mapSettings(settings: RestaurantSettings | null): Record<string, unknown> | null {
  if (!settings) return null;

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

function mapReservationPolicy(policy: ReservationPolicy | null): Record<string, unknown> | null {
  if (!policy) return null;

  return {
    id: policy.id,
    restaurantId: policy.restaurantId,
    enabled: policy.enabled,
    minPartySize: policy.minPartySize.value,
    maxPartySize: policy.maxPartySize.value,
    defaultReservationDuration: policy.defaultReservationDuration.value,
    minAdvanceBookingMinutes: policy.advanceBookingWindow.minMinutes,
    maxAdvanceBookingDays: policy.advanceBookingWindow.maxDays,
    cancellationDeadlineMinutes: policy.cancellationDeadlineMinutes.value,
    modificationDeadlineMinutes: policy.modificationDeadlineMinutes.value,
    allowWalkIns: policy.allowWalkIns,
    autoConfirmReservations: policy.autoConfirmReservations,
    requireCustomerPhone: policy.requireCustomerPhone,
    requireCustomerEmail: policy.requireCustomerEmail,
    maxActiveReservationsPerCustomer: policy.maxActiveReservationsPerCustomer,
    gracePeriodMinutes: policy.gracePeriodMinutes.value,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
  };
}

function mapBusinessHours(hours: BusinessHours | null): Record<string, unknown> | null {
  if (!hours) return null;

  return {
    id: hours.id,
    restaurantId: hours.restaurantId,
    schedules: hours.schedules.map((schedule) => ({
      dayOfWeek: schedule.dayOfWeek.value,
      isClosed: schedule.isClosed,
      periods: schedule.periods.map((period) => ({
        openTime: period.openTime.toString(),
        closeTime: period.closeTime.toString(),
        order: period.order,
      })),
    })),
    createdAt: hours.createdAt.toISOString(),
    updatedAt: hours.updatedAt.toISOString(),
  };
}

function mapCalendarExceptions(exceptions: CalendarException[] | undefined | null): Record<string, unknown>[] {
  if (!exceptions) return [];
  return exceptions.map((ex) => ({
    id: ex.id,
    restaurantId: ex.restaurantId,
    title: ex.title,
    description: ex.description,
    type: ex.type.value,
    date: ex.date.value,
    isClosed: ex.isClosed,
    openTime: ex.openTime,
    closeTime: ex.closeTime,
    allDay: ex.allDay,
    priority: ex.priority.value,
    createdAt: ex.createdAt.toISOString(),
    updatedAt: ex.updatedAt.toISOString(),
  }));
}

function generateVersion(config: ResolvedConfiguration): string {
  const timestamps = [
    config.restaurant.updatedAt.getTime(),
    config.settings?.updatedAt.getTime() ?? 0,
    config.reservationPolicy?.updatedAt.getTime() ?? 0,
    config.businessHours?.updatedAt.getTime() ?? 0,
    ...config.calendarExceptions.map((e) => e.updatedAt.getTime()),
  ];
  const max = Math.max(...timestamps);
  return max.toString(36);
}

export class RestaurantConfigurationMapper {
  static toDTO(config: ResolvedConfiguration): RestaurantConfigurationDTO {
    return {
      restaurant: mapRestaurantInfo(config.restaurant),
      settings: mapSettings(config.settings),
      reservationPolicy: mapReservationPolicy(config.reservationPolicy),
      businessHours: mapBusinessHours(config.businessHours),
      calendarExceptions: mapCalendarExceptions(config.calendarExceptions),
      metadata: {
        retrievedAt: new Date().toISOString(),
        version: generateVersion(config),
      },
    };
  }
}
