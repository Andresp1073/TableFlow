import type { ReservationAvailabilityResult } from "../dto/AvailabilityCheckResult.js";
import { ReservationAvailabilityError } from "../../errors/ReservationAvailabilityError.js";

export class AvailabilityMapper {
  mapToError(result: ReservationAvailabilityResult): ReservationAvailabilityError | null {
    if (result.available) {
      return null;
    }
    return new ReservationAvailabilityError(result.reason, result.metadata);
  }

  ensureAvailable(result: ReservationAvailabilityResult): void {
    const error = this.mapToError(result);
    if (error) {
      throw error;
    }
  }
}
