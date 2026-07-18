import type { AvailabilityEvaluator } from "../AvailabilityEvaluator.js";
import type { AvailabilityContext } from "../AvailabilityContext.js";
import type { AvailabilityResult } from "../AvailabilityResult.js";
import { unavailable, available } from "../AvailabilityResult.js";
import type { DiningArea } from "../../../../../dining-areas/domain/models/DiningArea.js";

export interface DiningAreaRepository {
  findByIdAndRestaurant(id: string, restaurantId: string): Promise<DiningArea | null>;
}

export class DiningAreaEvaluator implements AvailabilityEvaluator {
  readonly name = "dining_area";

  constructor(private readonly repository: DiningAreaRepository) {}

  async evaluate(context: AvailabilityContext): Promise<AvailabilityResult> {
    const { restaurantId, diningAreaId } = context;

    if (!diningAreaId) {
      return available();
    }

    const area = await this.repository.findByIdAndRestaurant(diningAreaId, restaurantId);
    if (!area) {
      return available();
    }

    if (!area.status.isActive()) {
      return unavailable("dining_area_inactive", { diningAreaId });
    }

    if (!area.isReservable) {
      return unavailable("dining_area_non_reservable", { diningAreaId });
    }

    return available();
  }
}
