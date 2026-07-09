import type { ReservationPolicy } from "../models/ReservationPolicy.js";
import type { PartySize } from "../models/PartySize.js";
import type { ReservationDuration } from "../models/ReservationDuration.js";
import type { AdvanceBookingWindow } from "../models/AdvanceBookingWindow.js";
import type { CancellationDeadline } from "../models/CancellationDeadline.js";
import type { GracePeriod } from "../models/GracePeriod.js";

export interface CreateReservationPolicyData {
  restaurantId: string;
  enabled: boolean;
  minPartySize: PartySize;
  maxPartySize: PartySize;
  defaultReservationDuration: ReservationDuration;
  advanceBookingWindow: AdvanceBookingWindow;
  cancellationDeadlineMinutes: CancellationDeadline;
  modificationDeadlineMinutes: CancellationDeadline;
  allowWalkIns: boolean;
  autoConfirmReservations: boolean;
  requireCustomerPhone: boolean;
  requireCustomerEmail: boolean;
  maxActiveReservationsPerCustomer: number;
  gracePeriodMinutes: GracePeriod;
}

export interface ReconstituteReservationPolicyData {
  id: string;
  restaurantId: string;
  enabled: boolean;
  minPartySize: number;
  maxPartySize: number;
  defaultReservationDuration: number;
  minAdvanceBookingMinutes: number;
  maxAdvanceBookingDays: number;
  cancellationDeadlineMinutes: number;
  modificationDeadlineMinutes: number;
  allowWalkIns: boolean;
  autoConfirmReservations: boolean;
  requireCustomerPhone: boolean;
  requireCustomerEmail: boolean;
  maxActiveReservationsPerCustomer: number;
  gracePeriodMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReservationPolicyFactory {
  create(data: CreateReservationPolicyData): ReservationPolicy;
  reconstitute(data: ReconstituteReservationPolicyData): ReservationPolicy;
}
