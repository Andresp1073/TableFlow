import { randomUUID } from "node:crypto";
import type { ReservationPolicy } from "../../domain/models/ReservationPolicy.js";
import type { ReservationPolicyFactory, CreateReservationPolicyData, ReconstituteReservationPolicyData } from "../../domain/repositories/ReservationPolicyFactory.js";
import { PartySize } from "../../domain/models/PartySize.js";
import { ReservationDuration } from "../../domain/models/ReservationDuration.js";
import { AdvanceBookingWindow } from "../../domain/models/AdvanceBookingWindow.js";
import { CancellationDeadline } from "../../domain/models/CancellationDeadline.js";
import { GracePeriod } from "../../domain/models/GracePeriod.js";

export class ConcreteReservationPolicyFactory implements ReservationPolicyFactory {
  create(data: CreateReservationPolicyData): ReservationPolicy {
    return {
      id: randomUUID(),
      restaurantId: data.restaurantId,
      enabled: data.enabled,
      minPartySize: data.minPartySize,
      maxPartySize: data.maxPartySize,
      defaultReservationDuration: data.defaultReservationDuration,
      advanceBookingWindow: data.advanceBookingWindow,
      cancellationDeadlineMinutes: data.cancellationDeadlineMinutes,
      modificationDeadlineMinutes: data.modificationDeadlineMinutes,
      allowWalkIns: data.allowWalkIns,
      autoConfirmReservations: data.autoConfirmReservations,
      requireCustomerPhone: data.requireCustomerPhone,
      requireCustomerEmail: data.requireCustomerEmail,
      maxActiveReservationsPerCustomer: data.maxActiveReservationsPerCustomer,
      gracePeriodMinutes: data.gracePeriodMinutes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  reconstitute(data: ReconstituteReservationPolicyData): ReservationPolicy {
    return {
      id: data.id,
      restaurantId: data.restaurantId,
      enabled: data.enabled,
      minPartySize: PartySize.reconstitute(data.minPartySize),
      maxPartySize: PartySize.reconstitute(data.maxPartySize),
      defaultReservationDuration: ReservationDuration.reconstitute(data.defaultReservationDuration),
      advanceBookingWindow: AdvanceBookingWindow.reconstitute(data.minAdvanceBookingMinutes, data.maxAdvanceBookingDays),
      cancellationDeadlineMinutes: CancellationDeadline.reconstitute(data.cancellationDeadlineMinutes),
      modificationDeadlineMinutes: CancellationDeadline.reconstitute(data.modificationDeadlineMinutes),
      allowWalkIns: data.allowWalkIns,
      autoConfirmReservations: data.autoConfirmReservations,
      requireCustomerPhone: data.requireCustomerPhone,
      requireCustomerEmail: data.requireCustomerEmail,
      maxActiveReservationsPerCustomer: data.maxActiveReservationsPerCustomer,
      gracePeriodMinutes: GracePeriod.reconstitute(data.gracePeriodMinutes),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
