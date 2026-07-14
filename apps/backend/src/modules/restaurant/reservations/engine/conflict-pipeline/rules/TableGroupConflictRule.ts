import type { ReservationRepository } from "../../../domain/repositories/ReservationRepository.js";
import type { ConflictRule, PipelineContext } from "../ConflictRule.js";
import type { ConflictResult } from "../ConflictResult.js";
import { noConflict, blockingConflict } from "../ConflictResult.js";
import { ReservationTimeRange } from "../../../domain/models/ReservationTimeRange.js";

export class TableGroupConflictRule implements ConflictRule {
  readonly name = "table_group_conflict";

  constructor(private readonly repository: ReservationRepository) {}

  async evaluate(context: PipelineContext): Promise<ConflictResult> {
    if (!context.tableGroupId) {
      return noConflict();
    }

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
      if (r.tableGroupId !== context.tableGroupId) {
        return false;
      }
      return r.timeRange.overlapsWith(timeRange);
    });

    if (conflicting.length > 0) {
      return blockingConflict(
        "TABLE_GROUP_CONFLICT",
        `Table group ${context.tableGroupId} already reserved during the requested time slot`,
        {
          conflictingIds: conflicting.map((r) => r.id),
          tableGroupId: context.tableGroupId,
          conflictingCount: conflicting.length,
        },
      );
    }

    return noConflict();
  }
}
