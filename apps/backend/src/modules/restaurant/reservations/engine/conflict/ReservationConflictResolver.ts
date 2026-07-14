import type { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import type { Reservation } from "../../domain/models/Reservation.js";
import { ReservationTimeRange } from "../../domain/models/ReservationTimeRange.js";
import type { ConflictResolutionResult } from "../types.js";

export interface ConflictCheckInput {
  restaurantId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  tableId?: string | null;
  tableGroupId?: string | null;
  excludeReservationId?: string;
}

export class ReservationConflictResolver {
  constructor(private readonly repository: ReservationRepository) {}

  async checkForConflicts(input: ConflictCheckInput): Promise<ConflictResolutionResult> {
    const existingReservations = await this.repository.findByFilters({
      restaurantId: input.restaurantId,
      date: input.date,
    });

    const filteredReservations = input.excludeReservationId
      ? existingReservations.filter((r) => r.id !== input.excludeReservationId)
      : existingReservations;

    const activeReservations = filteredReservations.filter((r) => r.status.isActive());

    const timeRange = ReservationTimeRange.create(input.startTime, input.endTime);

    const conflictingReservations = activeReservations.filter((existing) => {
      if (!existing.timeRange.overlapsWith(timeRange)) {
        return false;
      }

      if (input.tableId && input.tableId === existing.tableId) {
        return true;
      }

      if (input.tableGroupId && input.tableGroupId === existing.tableGroupId) {
        return true;
      }

      if (!input.tableId && !input.tableGroupId) {
        return false;
      }

      return false;
    });

    if (conflictingReservations.length > 0) {
      return {
        hasConflict: true,
        conflictingReservations: conflictingReservations.map((r) => r.id),
        reason: `Found ${conflictingReservations.length} conflicting reservation(s) for the requested time slot`,
      };
    }

    return {
      hasConflict: false,
      conflictingReservations: [],
      reason: null,
    };
  }

  async findConflictsForUpdate(
    input: ConflictCheckInput,
    existingReservation: Reservation,
  ): Promise<ConflictResolutionResult> {
    const newTimeRange = ReservationTimeRange.create(input.startTime, input.endTime);

    const hasChangedTime =
      !existingReservation.timeRange.equals(newTimeRange);

    const hasChangedTable =
      existingReservation.tableId !== (input.tableId ?? null);

    if (!hasChangedTime && !hasChangedTable) {
      return {
        hasConflict: false,
        conflictingReservations: [],
        reason: null,
      };
    }

    return this.checkForConflicts(input);
  }
}
