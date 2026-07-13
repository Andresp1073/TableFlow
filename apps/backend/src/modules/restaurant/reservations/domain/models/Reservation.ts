import type { ReservationNumber } from "./ReservationNumber.js";
import type { ReservationDate } from "./ReservationDate.js";
import type { ReservationTimeRange } from "./ReservationTimeRange.js";
import type { PartySize } from "./PartySize.js";
import type { ReservationStatus } from "./ReservationStatus.js";
import type { ReservationSource } from "./ReservationSource.js";

export interface Reservation {
  id: string;
  restaurantId: string;
  reservationNumber: ReservationNumber;
  customerId: string | null;
  tableId: string | null;
  tableGroupId: string | null;
  date: ReservationDate;
  timeRange: ReservationTimeRange;
  partySize: PartySize;
  status: ReservationStatus;
  source: ReservationSource;
  notes: string | null;
  specialRequests: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
}
