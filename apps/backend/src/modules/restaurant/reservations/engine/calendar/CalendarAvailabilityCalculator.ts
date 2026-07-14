import type { Reservation } from "../../domain/models/Reservation.js";
import type { Table } from "../../../tables/domain/models/Table.js";
import type { CalendarAvailabilityView, TimeSlotAvailability } from "./types.js";

export class CalendarAvailabilityCalculator {
  calculate(
    date: Date,
    restaurantId: string,
    tables: Table[],
    activeReservations: Reservation[],
  ): CalendarAvailabilityView {
    const totalTables = tables.length;
    const totalCapacity = tables.reduce((sum, t) => sum + t.maximumCapacity.value, 0);

    const timeSlots = this.calculateTimeSlotAvailability(date, tables, activeReservations);

    const fullyBookedSlots = timeSlots.filter((s) => s.isFullyBooked);

    const distinctReservedTableIds = new Set(
      activeReservations
        .map((r) => r.tableId)
        .filter((id): id is string => id !== null),
    );
    const availableTables = Math.max(0, totalTables - distinctReservedTableIds.size);

    const availableCapacity = timeSlots.length > 0
      ? Math.max(...timeSlots.map((s) => s.availableCapacity))
      : totalCapacity;

    return {
      date,
      restaurantId,
      totalTables,
      totalCapacity,
      maxAvailableCapacity: totalCapacity - activeReservations.reduce((s, r) => s + r.partySize.value, 0),
      availableTables,
      availableCapacity,
      isFullyBooked: fullyBookedSlots.length === timeSlots.length && timeSlots.length > 0,
      timeSlots,
    };
  }

  private calculateTimeSlotAvailability(
    date: Date,
    tables: Table[],
    activeReservations: Reservation[],
  ): TimeSlotAvailability[] {
    const slots: TimeSlotAvailability[] = [];
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    for (let hour = 0; hour < 24; hour++) {
      const slotStart = new Date(Date.UTC(year, month, day, hour, 0, 0, 0));
      const slotEnd = new Date(Date.UTC(year, month, day, hour, 59, 59, 999));

      const overlapping = activeReservations.filter((r) =>
        r.timeRange.startTime.getTime() < slotEnd.getTime() &&
        r.timeRange.endTime.getTime() > slotStart.getTime(),
      );

      const reservedTableIds = new Set(
        overlapping.map((r) => r.tableId).filter((id): id is string => id !== null),
      );

      const availableInSlot = tables.filter((t) => !reservedTableIds.has(t.id));
      const slotAvailableCapacity = availableInSlot.reduce((s, t) => s + t.maximumCapacity.value, 0);

      slots.push({
        time: { hour, minute: 0, label: `${hour.toString().padStart(2, "0")}:00` },
        availableTables: availableInSlot.length,
        availableCapacity: slotAvailableCapacity,
        isFullyBooked: availableInSlot.length === 0,
      });
    }

    return slots;
  }
}
