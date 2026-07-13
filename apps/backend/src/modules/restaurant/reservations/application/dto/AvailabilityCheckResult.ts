import type { AvailabilityCheckResponse } from "../ports/AvailabilityService.js";

export interface ReservationAvailabilityResult {
  available: boolean;
  reason: string | null;
  metadata?: Record<string, unknown>;
}

export function toAvailabilityResult(response: AvailabilityCheckResponse): ReservationAvailabilityResult {
  return {
    available: response.available,
    reason: response.reason,
    metadata: response.metadata,
  };
}
