import { ReservationConflictPipeline } from "../conflict-pipeline/ReservationConflictPipeline.js";
import type { Reservation } from "../../domain/models/Reservation.js";
import type { CalendarConflictView, AggregatedConflict } from "./types.js";

export class CalendarConflictAggregator {
  constructor(private readonly pipeline: ReservationConflictPipeline) {}

  async aggregate(
    date: Date,
    restaurantId: string,
    activeReservations: Reservation[],
  ): Promise<CalendarConflictView> {
    const conflicts: AggregatedConflict[] = [];
    const seen = new Map<string, AggregatedConflict>();

    for (const reservation of activeReservations) {
      const result = await this.pipeline.evaluateAll({
        restaurantId,
        date,
        startTime: reservation.timeRange.startTime,
        endTime: reservation.timeRange.endTime,
        partySize: reservation.partySize.value,
        tableId: reservation.tableId,
        tableGroupId: reservation.tableGroupId,
      });

      for (const pipelineResult of result.results) {
        if (!pipelineResult.isConflict) continue;

        const key = `${pipelineResult.code ?? "unknown"}_${pipelineResult.metadata?.rule ?? "unknown"}`;
        const existing = seen.get(key);

        if (existing) {
          existing.count++;
          if (reservation.id) {
            existing.reservationIds.push(reservation.id);
          }
        } else {
          const agg: AggregatedConflict = {
            code: pipelineResult.code ?? "UNKNOWN",
            severity: pipelineResult.severity,
            reason: pipelineResult.reason ?? "Unknown conflict",
            count: 1,
            rule: (pipelineResult.metadata?.rule as string) ?? "unknown",
            reservationIds: reservation.id ? [reservation.id] : [],
          };
          seen.set(key, agg);
          conflicts.push(agg);
        }
      }
    }

    const blockingConflicts = conflicts.filter((c) => c.severity === "blocking");
    const warningConflicts = conflicts.filter((c) => c.severity === "warning");
    const infoConflicts = conflicts.filter((c) => c.severity === "info");

    return {
      date,
      restaurantId,
      totalConflicts: conflicts.reduce((sum, c) => sum + c.count, 0),
      blockingConflicts: blockingConflicts.reduce((sum, c) => sum + c.count, 0),
      warningConflicts: warningConflicts.reduce((sum, c) => sum + c.count, 0),
      infoConflicts: infoConflicts.reduce((sum, c) => sum + c.count, 0),
      conflicts,
    };
  }
}
