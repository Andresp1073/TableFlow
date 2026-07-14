import type { Reservation } from "../../domain/models/Reservation.js";
import type { Table } from "../../../tables/domain/models/Table.js";
import type { CalendarWeekView, WeeklySummary } from "./types.js";
import type { CalendarDayBuilder } from "./CalendarDayBuilder.js";

export class CalendarWeekBuilder {
  constructor(private readonly dayBuilder: CalendarDayBuilder) {}

  async build(
    startDate: Date,
    restaurantId: string,
    reservationsByDate: Map<string, Reservation[]>,
    tablesByDate: Map<string, Table[]>,
  ): Promise<CalendarWeekView> {
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0] ?? "";

      const dayReservations = reservationsByDate.get(dateKey) ?? [];
      const dayTables = tablesByDate.get(dateKey) ?? [];

      const dayView = await this.dayBuilder.build(
        date,
        restaurantId,
        dayReservations,
        dayTables,
      );

      days.push(dayView);
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const summary = this.calculateSummary(days);

    return {
      startDate,
      endDate,
      restaurantId,
      days,
      summary,
    };
  }

  private calculateSummary(days: CalendarWeekView["days"]): WeeklySummary {
    let totalReservations = 0;
    let totalGuests = 0;
    let totalOccupancyRate = 0;
    let totalConflicts = 0;
    let blockedConflicts = 0;

    for (const day of days) {
      totalReservations += day.reservations.length;
      totalGuests += day.reservations.reduce((s, r) => s + r.partySize, 0);
      totalOccupancyRate += day.occupancy.occupancyRate;
      totalConflicts += day.conflicts.totalConflicts;
      blockedConflicts += day.conflicts.blockingConflicts;
    }

    return {
      totalReservations,
      totalGuests,
      averagePartySize: totalReservations > 0
        ? Math.round((totalGuests / totalReservations) * 100) / 100
        : 0,
      averageOccupancyRate: days.length > 0
        ? Math.round((totalOccupancyRate / days.length) * 100) / 100
        : 0,
      totalConflicts,
      blockedConflicts,
    };
  }
}
