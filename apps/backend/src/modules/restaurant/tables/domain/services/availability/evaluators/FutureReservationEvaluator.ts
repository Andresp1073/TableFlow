import type { AvailabilityEvaluator } from "../AvailabilityEvaluator.js";
import type { AvailabilityContext } from "../AvailabilityContext.js";
import type { AvailabilityResult } from "../AvailabilityResult.js";
import { available } from "../AvailabilityResult.js";

export class FutureReservationEvaluator implements AvailabilityEvaluator {
  readonly name = "future_reservation";

  async evaluate(_context: AvailabilityContext): Promise<AvailabilityResult> {
    return available();
  }
}
