import type { AvailabilityContext } from "./AvailabilityContext.js";
import type { AvailabilityResult } from "./AvailabilityResult.js";

export interface AvailabilityEvaluator {
  readonly name: string;
  evaluate(context: AvailabilityContext): Promise<AvailabilityResult>;
}
