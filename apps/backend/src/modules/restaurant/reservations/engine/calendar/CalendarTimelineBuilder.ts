import type { Reservation } from "../../domain/models/Reservation.js";
import type { Table } from "../../../tables/domain/models/Table.js";
import type { CalendarTimelineView, CalendarTimelineSlot, CalendarReservationSummary } from "./types.js";

export class CalendarTimelineBuilder {
  build(
    date: Date,
    restaurantId: string,
    reservations: Reservation[],
    tables: Table[],
  ): CalendarTimelineView {
    const summaries = this.toSummaries(reservations);
    const activeReservations = reservations.filter((r) => r.status.isActive());

    const slots: CalendarTimelineSlot[] = [];
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    for (let hour = 0; hour < 24; hour++) {
      const slotStart = new Date(Date.UTC(year, month, day, hour, 0, 0, 0));
      const slotEnd = new Date(Date.UTC(year, month, day, hour, 59, 59, 999));

      const slotReservations = summaries.filter((r) =>
        r.startTime.getTime() < slotEnd.getTime() &&
        r.endTime.getTime() > slotStart.getTime(),
      );

      const overlappingReservations = activeReservations.filter((r) =>
        r.timeRange.startTime.getTime() < slotEnd.getTime() &&
        r.timeRange.endTime.getTime() > slotStart.getTime(),
      );

      const reservedTableIdsForCount = new Set(
        overlappingReservations
          .filter((r) => r.tableId !== null)
          .map((r) => r.tableId as string),
      );

      const availableInSlot = tables.filter((t) => !reservedTableIdsForCount.has(t.id));

      slots.push({
        time: { hour, minute: 0, label: `${hour.toString().padStart(2, "0")}:00` },
        reservations: slotReservations,
        availableCount: availableInSlot.length,
        occupiedCount: overlappingReservations.length,
      });
    }

    return {
      date,
      restaurantId,
      slots,
      reservations: summaries,
    };
  }

  private toSummaries(reservations: Reservation[]): CalendarReservationSummary[] {
    return reservations.map((r) => ({
      id: r.id,
      reservationNumber: r.reservationNumber.value,
      customerId: r.customerId,
      tableId: r.tableId,
      tableGroupId: r.tableGroupId,
      startTime: r.timeRange.startTime,
      endTime: r.timeRange.endTime,
      partySize: r.partySize.value,
      status: r.status.value,
      source: r.source.value,
      notes: r.notes,
    }));
  }
}
