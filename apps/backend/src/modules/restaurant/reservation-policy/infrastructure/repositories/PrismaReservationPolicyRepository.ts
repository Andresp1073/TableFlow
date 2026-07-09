import { PrismaClient } from "@prisma/client";
import type { ReservationPolicy } from "../../domain/models/ReservationPolicy.js";
import type { ReservationPolicyRepository } from "../../domain/repositories/ReservationPolicyRepository.js";
import { ConcreteReservationPolicyFactory } from "./ConcreteReservationPolicyFactory.js";

export class PrismaReservationPolicyRepository implements ReservationPolicyRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly factory: ConcreteReservationPolicyFactory,
  ) {}

  async findByRestaurantId(restaurantId: string): Promise<ReservationPolicy | null> {
    const record = await this.prisma.reservationPolicy.findUnique({
      where: { restaurantId },
    });

    if (!record) return null;

    return this.factory.reconstitute({
      id: record.id,
      restaurantId: record.restaurantId,
      enabled: record.enabled,
      minPartySize: record.minPartySize,
      maxPartySize: record.maxPartySize,
      defaultReservationDuration: record.defaultReservationDuration,
      minAdvanceBookingMinutes: record.minAdvanceBookingMinutes,
      maxAdvanceBookingDays: record.maxAdvanceBookingDays,
      cancellationDeadlineMinutes: record.cancellationDeadlineMinutes,
      modificationDeadlineMinutes: record.modificationDeadlineMinutes,
      allowWalkIns: record.allowWalkIns,
      autoConfirmReservations: record.autoConfirmReservations,
      requireCustomerPhone: record.requireCustomerPhone,
      requireCustomerEmail: record.requireCustomerEmail,
      maxActiveReservationsPerCustomer: record.maxActiveReservationsPerCustomer,
      gracePeriodMinutes: record.gracePeriodMinutes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async save(policy: ReservationPolicy): Promise<ReservationPolicy> {
    const record = await this.prisma.reservationPolicy.create({
      data: {
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
      },
    });

    return this.factory.reconstitute({
      id: record.id,
      restaurantId: record.restaurantId,
      enabled: record.enabled,
      minPartySize: record.minPartySize,
      maxPartySize: record.maxPartySize,
      defaultReservationDuration: record.defaultReservationDuration,
      minAdvanceBookingMinutes: record.minAdvanceBookingMinutes,
      maxAdvanceBookingDays: record.maxAdvanceBookingDays,
      cancellationDeadlineMinutes: record.cancellationDeadlineMinutes,
      modificationDeadlineMinutes: record.modificationDeadlineMinutes,
      allowWalkIns: record.allowWalkIns,
      autoConfirmReservations: record.autoConfirmReservations,
      requireCustomerPhone: record.requireCustomerPhone,
      requireCustomerEmail: record.requireCustomerEmail,
      maxActiveReservationsPerCustomer: record.maxActiveReservationsPerCustomer,
      gracePeriodMinutes: record.gracePeriodMinutes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async update(policy: ReservationPolicy): Promise<ReservationPolicy> {
    const record = await this.prisma.reservationPolicy.update({
      where: { id: policy.id },
      data: {
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
      },
    });

    return this.factory.reconstitute({
      id: record.id,
      restaurantId: record.restaurantId,
      enabled: record.enabled,
      minPartySize: record.minPartySize,
      maxPartySize: record.maxPartySize,
      defaultReservationDuration: record.defaultReservationDuration,
      minAdvanceBookingMinutes: record.minAdvanceBookingMinutes,
      maxAdvanceBookingDays: record.maxAdvanceBookingDays,
      cancellationDeadlineMinutes: record.cancellationDeadlineMinutes,
      modificationDeadlineMinutes: record.modificationDeadlineMinutes,
      allowWalkIns: record.allowWalkIns,
      autoConfirmReservations: record.autoConfirmReservations,
      requireCustomerPhone: record.requireCustomerPhone,
      requireCustomerEmail: record.requireCustomerEmail,
      maxActiveReservationsPerCustomer: record.maxActiveReservationsPerCustomer,
      gracePeriodMinutes: record.gracePeriodMinutes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
