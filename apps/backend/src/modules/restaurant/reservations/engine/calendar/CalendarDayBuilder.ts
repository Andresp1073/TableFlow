import type { Reservation } from "../../domain/models/Reservation.js";
import type { Table } from "../../../tables/domain/models/Table.js";
import type { CalendarDayView, CalendarReservationSummary } from "./types.js";
import type { CalendarOccupancyCalculator } from "./CalendarOccupancyCalculator.js";
import type { CalendarAvailabilityCalculator } from "./CalendarAvailabilityCalculator.js";
import type { CalendarConflictAggregator } from "./CalendarConflictAggregator.js";

export class CalendarDayBuilder {
  constructor(
    private readonly occupancyCalculator: CalendarOccupancyCalculator,
    private readonly availabilityCalculator: CalendarAvailabilityCalculator,
    private readonly conflictAggregator: CalendarConflictAggregator,
  ) {}

  async build(
    date: Date,
    restaurantId: string,
    reservations: Reservation[],
    tables: Table[],
  ): Promise<CalendarDayView> {
    const summaries = this.toSummaries(reservations);
    const allReservations = reservations;

    const occupancy = this.occupancyCalculator.calculate(
      date,
      restaurantId,
      tables,
      summaries,
      allReservations,
    );

    const activeReservations = allReservations.filter((r) => r.status.isActive());

    const availability = this.availabilityCalculator.calculate(
      date,
      restaurantId,
      tables,
      activeReservations,
    );

    const conflicts = await this.conflictAggregator.aggregate(
      date,
      restaurantId,
      activeReservations,
    );

    return {
      date,
      restaurantId,
      reservations: summaries,
      occupancy,
      availability,
      conflicts,
    };
  }

  toSummaries(reservations: Reservation[]): CalendarReservationSummary[] {
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
