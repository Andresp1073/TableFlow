import type { PartySize } from "./PartySize.js";
import type { ReservationDuration } from "./ReservationDuration.js";
import type { AdvanceBookingWindow } from "./AdvanceBookingWindow.js";
import type { CancellationDeadline } from "./CancellationDeadline.js";
import type { GracePeriod } from "./GracePeriod.js";

export interface ReservationPolicy {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}
