import type { AvailabilityEvaluator } from "../AvailabilityEvaluator.js";
import type { AvailabilityContext } from "../AvailabilityContext.js";
import type { AvailabilityResult } from "../AvailabilityResult.js";
import { unavailable, available } from "../AvailabilityResult.js";

export class RestaurantStatusEvaluator implements AvailabilityEvaluator {
  readonly name = "restaurant_status";

  async evaluate(context: AvailabilityContext): Promise<AvailabilityResult> {
    const { restaurantId } = context;

    if (!restaurantId) {
      return unavailable("unknown", { message: "Restaurant ID is required" });
    }

    return available();
  }
}
