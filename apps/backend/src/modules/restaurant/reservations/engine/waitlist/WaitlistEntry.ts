import type { WaitlistStatus } from "./WaitlistStatus.js";
import type { ReservationSource } from "../../domain/models/ReservationSource.js";

export interface WaitlistEntry {
  id: string;
  restaurantId: string;
  reservationId: string | null;
  customerId: string | null;
  partySize: number;
  source: ReservationSource;
  requestedDate: Date;
  requestedStartTime: Date;
  requestedEndTime: Date;
  status: WaitlistStatus;
  priority: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiredAt: Date | null;
  promotedAt: Date | null;
}
