import { randomUUID } from "node:crypto";
import type { Reservation } from "../../domain/models/Reservation.js";
import { ReservationNumber } from "../../domain/models/ReservationNumber.js";
import { ReservationDate } from "../../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../../domain/models/ReservationTimeRange.js";
import { PartySize } from "../../domain/models/PartySize.js";
import { ReservationStatus } from "../../domain/models/ReservationStatus.js";
import { ReservationSource } from "../../domain/models/ReservationSource.js";
import type {
  ReservationFactory,
  CreateReservationData,
  ReconstituteReservationData,
} from "../../domain/repositories/ReservationFactory.js";

export class ConcreteReservationFactory implements ReservationFactory {
  create(data: CreateReservationData): Reservation {
    const now = new Date();

    return {
      id: randomUUID(),
      restaurantId: data.restaurantId,
      reservationNumber: data.reservationNumber,
      customerId: data.customerId ?? null,
      tableId: data.tableId ?? null,
      tableGroupId: data.tableGroupId ?? null,
      date: data.date,
      timeRange: data.timeRange,
      partySize: data.partySize,
      status: data.status ?? ReservationStatus.create("pending"),
      source: data.source,
      notes: data.notes ?? null,
      specialRequests: data.specialRequests ?? null,
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
      cancelledAt: null,
    };
  }

  reconstitute(data: ReconstituteReservationData): Reservation {
    return {
      id: data.id,
      restaurantId: data.restaurantId,
      reservationNumber: ReservationNumber.reconstitute(data.reservationNumber),
      customerId: data.customerId,
      tableId: data.tableId,
      tableGroupId: data.tableGroupId,
      date: ReservationDate.reconstitute(data.date),
      timeRange: ReservationTimeRange.reconstitute(data.startTime, data.endTime),
      partySize: PartySize.reconstitute(data.partySize),
      status: ReservationStatus.reconstitute(data.status),
      source: ReservationSource.reconstitute(data.source),
      notes: data.notes,
      specialRequests: data.specialRequests,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      cancelledAt: data.cancelledAt,
    };
  }
}
