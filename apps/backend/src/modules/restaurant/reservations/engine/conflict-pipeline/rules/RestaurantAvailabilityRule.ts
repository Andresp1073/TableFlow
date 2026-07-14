import type { AvailabilityService } from "../../../application/ports/AvailabilityService.js";
import type { ConflictRule, PipelineContext } from "../ConflictRule.js";
import type { ConflictResult } from "../ConflictResult.js";
import { noConflict, blockingConflict } from "../ConflictResult.js";

export class RestaurantAvailabilityRule implements ConflictRule {
  readonly name = "restaurant_availability";

  constructor(private readonly availabilityService: AvailabilityService) {}

  async evaluate(context: PipelineContext): Promise<ConflictResult> {
    const result = await this.availabilityService.checkAvailability({
      restaurantId: context.restaurantId,
      date: context.date.toISOString(),
      startTime: context.startTime.toISOString(),
      endTime: context.endTime.toISOString(),
      partySize: context.partySize,
      tableId: context.tableId,
      diningAreaId: context.diningAreaId,
      tableTypeId: context.tableTypeId,
    });

    if (!result.available) {
      return blockingConflict(
        "RESTAURANT_AVAILABILITY",
        result.reason ?? "Restaurant not available at the requested time",
        { availabilityReason: result.reason, ...result.metadata },
      );
    }

    return noConflict();
  }
}
