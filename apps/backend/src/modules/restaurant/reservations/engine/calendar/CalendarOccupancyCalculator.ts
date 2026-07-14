import type { Reservation } from "../../domain/models/Reservation.js";
import type { Table } from "../../../tables/domain/models/Table.js";
import type { OccupancyView, HourlyOccupancy, CalendarReservationSummary } from "./types.js";

export class CalendarOccupancyCalculator {
  calculate(
    date: Date,
    restaurantId: string,
    tables: Table[],
    reservations: CalendarReservationSummary[],
    allReservations: Reservation[],
  ): OccupancyView {
    const totalTables = tables.length;
    const totalCapacity = tables.reduce((sum, t) => sum + t.maximumCapacity.value, 0);

    const activeReservations = allReservations.filter((r) => r.status.isActive());

    const hourlyBreakdown = this.calculateHourlyBreakdown(date, totalTables, totalCapacity, activeReservations);

    const peakOccupancyHour = this.findPeakOccupancyHour(hourlyBreakdown);

    const activeCapacity = activeReservations.reduce((sum, r) => sum + r.partySize.value, 0);

    return {
      date,
      restaurantId,
      totalTables,
      totalCapacity,
      occupiedTables: activeReservations.length,
      occupiedCapacity: activeCapacity,
      occupancyRate: totalTables > 0 ? Math.round((activeReservations.length / totalTables) * 10000) / 100 : 0,
      capacityRate: totalCapacity > 0 ? Math.round((activeCapacity / totalCapacity) * 10000) / 100 : 0,
      peakOccupancyHour,
      hourlyBreakdown,
    };
  }

  private calculateHourlyBreakdown(
    date: Date,
    totalTables: number,
    totalCapacity: number,
    activeReservations: Reservation[],
  ): HourlyOccupancy[] {
    const breakdown: HourlyOccupancy[] = [];
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

      const occupiedCapacity = overlapping.reduce((sum, r) => sum + r.partySize.value, 0);

      breakdown.push({
        hour,
        totalTables,
        occupiedTables: overlapping.length,
        occupancyRate: totalTables > 0 ? Math.round((overlapping.length / totalTables) * 10000) / 100 : 0,
        totalCapacity,
        occupiedCapacity,
        capacityRate: totalCapacity > 0 ? Math.round((occupiedCapacity / totalCapacity) * 10000) / 100 : 0,
      });
    }

    return breakdown;
  }

  private findPeakOccupancyHour(hourlyBreakdown: HourlyOccupancy[]): number | null {
    let peak: HourlyOccupancy | null = null;

    for (const slot of hourlyBreakdown) {
      if (!peak || slot.occupiedTables > peak.occupiedTables) {
        peak = slot;
      }
    }

    if (peak && peak.occupiedTables === 0) {
      return null;
    }

    return peak ? peak.hour : null;
  }
}
