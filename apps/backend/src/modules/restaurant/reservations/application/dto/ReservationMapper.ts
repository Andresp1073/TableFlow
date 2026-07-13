import type { Reservation } from "../../domain/models/Reservation.js";
import type { ReservationDTO } from "./ReservationDTO.js";
import type { ReservationSummary } from "./ReservationSummary.js";

export class ReservationMapper {
  static toDTO(reservation: Reservation): ReservationDTO {
    return {
      id: reservation.id,
      restaurantId: reservation.restaurantId,
      reservationNumber: reservation.reservationNumber.value,
      customerId: reservation.customerId,
      tableId: reservation.tableId,
      tableGroupId: reservation.tableGroupId,
      date: reservation.date.value.toISOString(),
      startTime: reservation.timeRange.startTime.toISOString(),
      endTime: reservation.timeRange.endTime.toISOString(),
      partySize: reservation.partySize.value,
      status: reservation.status.value,
      source: reservation.source.value,
      notes: reservation.notes,
      specialRequests: reservation.specialRequests,
      createdBy: reservation.createdBy,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
      cancelledAt: reservation.cancelledAt?.toISOString() ?? null,
    };
  }

  static toSummary(reservation: Reservation): ReservationSummary {
    return {
      id: reservation.id,
      restaurantId: reservation.restaurantId,
      reservationNumber: reservation.reservationNumber.value,
      customerId: reservation.customerId,
      date: reservation.date.value.toISOString(),
      startTime: reservation.timeRange.startTime.toISOString(),
      endTime: reservation.timeRange.endTime.toISOString(),
      partySize: reservation.partySize.value,
      status: reservation.status.value,
      source: reservation.source.value,
      createdAt: reservation.createdAt.toISOString(),
    };
  }

  static toDTOList(reservations: Reservation[]): ReservationDTO[] {
    return reservations.map(ReservationMapper.toDTO);
  }

  static toSummaryList(reservations: Reservation[]): ReservationSummary[] {
    return reservations.map(ReservationMapper.toSummary);
  }
}
