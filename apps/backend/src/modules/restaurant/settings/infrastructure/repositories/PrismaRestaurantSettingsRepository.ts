import type { PrismaClient } from "@prisma/client";
import type { RestaurantSettings } from "../../domain/models/RestaurantSettings.js";
import type { RestaurantSettingsRepository } from "../../domain/repositories/RestaurantSettingsRepository.js";
import type { ConcreteRestaurantSettingsFactory } from "./ConcreteRestaurantSettingsFactory.js";

export class PrismaRestaurantSettingsRepository implements RestaurantSettingsRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly factory: ConcreteRestaurantSettingsFactory,
  ) {}

  async findByRestaurantId(restaurantId: string): Promise<RestaurantSettings | null> {
    const record = await this.prisma.restaurantSettings.findUnique({
      where: { restaurantId },
    });

    if (!record) return null;

    const value = record as unknown as Record<string, unknown>;

    return this.factory.reconstitute({
      id: value['id'] as string,
      restaurantId: value['restaurantId'] as string,
      timezone: value['timezone'] as string,
      currency: value['currency'] as string,
      language: value['language'] as string,
      dateFormat: value['dateFormat'] as string,
      timeFormat: value['timeFormat'] as string,
      weekStartsOn: value['weekStartsOn'] as number,
      taxPercentage: Number(value['taxPercentage']),
      serviceChargePercentage: Number(value['serviceChargePercentage']),
      defaultReservationDuration: value['defaultReservationDuration'] as number,
      reservationBufferMinutes: value['reservationBufferMinutes'] as number,
      allowWalkIns: value['allowWalkIns'] as boolean,
      autoConfirmReservations: value['autoConfirmReservations'] as boolean,
      maxReservationsPerCustomer: value['maxReservationsPerCustomer'] as number,
      reservationCancellationHours: value['reservationCancellationHours'] as number,
      createdAt: value['createdAt'] as Date,
      updatedAt: value['updatedAt'] as Date,
    });
  }

  async save(settings: RestaurantSettings): Promise<RestaurantSettings> {
    const data = {
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
    };

    await this.prisma.restaurantSettings.create({ data: data as never });

    return settings;
  }

  async update(settings: RestaurantSettings): Promise<RestaurantSettings> {
    const data = {
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
    };

    await this.prisma.restaurantSettings.update({
      where: { id: settings.id },
      data: data as never,
    });

    return settings;
  }
}
