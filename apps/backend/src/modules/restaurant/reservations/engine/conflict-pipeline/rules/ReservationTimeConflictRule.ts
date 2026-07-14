import type { ReservationRepository } from "../../../domain/repositories/ReservationRepository.js";
import type { ConflictRule, PipelineContext } from "../ConflictRule.js";
import type { ConflictResult } from "../ConflictResult.js";
import { noConflict, blockingConflict, warningConflict } from "../ConflictResult.js";
import { ReservationTimeRange } from "../../../domain/models/ReservationTimeRange.js";

export class ReservationTimeConflictRule implements ConflictRule {
  readonly name = "reservation_time_conflict";

  constructor(private readonly repository: ReservationRepository) {}

  async evaluate(context: PipelineContext): Promise<ConflictResult> {
    const existingReservations = await this.repository.findByFilters({
      restaurantId: context.restaurantId,
      date: context.date,
    });

    const filtered = context.excludeReservationId
      ? existingReservations.filter((r) => r.id !== context.excludeReservationId)
      : existingReservations;

    const active = filtered.filter((r) => r.status.isActive());
    const timeRange = ReservationTimeRange.create(context.startTime, context.endTime);

    const conflicting = active.filter((r) => {
      if (!r.tableId && !r.tableGroupId) {
        return r.timeRange.overlapsWith(timeRange);
      }
      return false;
    });

    if (conflicting.length > 0) {
      const hasDirectTableConflict = context.tableId !== undefined && context.tableId !== null
        && conflicting.some((r) => r.tableId === context.tableId);

      if (hasDirectTableConflict) {
        return blockingConflict(
          "TIME_CONFLICT",
          `Found ${conflicting.length} overlapping reservation(s) for table ${context.tableId}`,
          {
            conflictingIds: conflicting.map((r) => r.id),
            conflictingCount: conflicting.length,
          },
        );
      }

      return warningConflict(
        "TIME_WARNING",
        `Found ${conflicting.length} reservation(s) with overlapping time slots`,
        {
          conflictingIds: conflicting.map((r) => r.id),
          conflictingCount: conflicting.length,
        },
      );
    }

    return noConflict();
  }
}
