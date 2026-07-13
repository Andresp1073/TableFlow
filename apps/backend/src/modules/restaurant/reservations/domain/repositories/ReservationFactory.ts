import type { Reservation } from "../models/Reservation.js";
import type { ReservationNumber } from "../models/ReservationNumber.js";
import type { ReservationDate } from "../models/ReservationDate.js";
import type { ReservationTimeRange } from "../models/ReservationTimeRange.js";
import type { PartySize } from "../models/PartySize.js";
import type { ReservationStatus } from "../models/ReservationStatus.js";
import type { ReservationSource } from "../models/ReservationSource.js";

export interface CreateReservationData {
  restaurantId: string;
  reservationNumber: ReservationNumber;
  customerId?: string | null;
  tableId?: string | null;
  tableGroupId?: string | null;
  date: ReservationDate;
  timeRange: ReservationTimeRange;
  partySize: PartySize;
  status?: ReservationStatus;
  source: ReservationSource;
  notes?: string | null;
  specialRequests?: string | null;
  createdBy: string;
}

export interface ReconstituteReservationData {
  id: string;
  restaurantId: string;
  reservationNumber: string;
  customerId: string | null;
  tableId: string | null;
  tableGroupId: string | null;
  date: Date;
  startTime: Date;
  endTime: Date;
  partySize: number;
  status: string;
  source: string;
  notes: string | null;
  specialRequests: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
}

export interface ReservationFactory {
  create(data: CreateReservationData): Reservation;
  reconstitute(data: ReconstituteReservationData): Reservation;
}
