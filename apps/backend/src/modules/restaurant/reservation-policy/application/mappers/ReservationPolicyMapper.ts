import type { ReservationPolicy } from "../../domain/models/ReservationPolicy.js";
import type { ReservationPolicyDTO } from "../dtos/ReservationPolicyDTO.js";

export class ReservationPolicyMapper {
  static toDTO(policy: ReservationPolicy): ReservationPolicyDTO {
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
}
