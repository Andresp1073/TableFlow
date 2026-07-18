import type { AvailabilityEvaluator } from "../AvailabilityEvaluator.js";
import type { AvailabilityContext } from "../AvailabilityContext.js";
import type { AvailabilityResult } from "../AvailabilityResult.js";
import { unavailable, available } from "../AvailabilityResult.js";
import type { ReservationPolicy } from "../../../../../reservation-policy/domain/models/ReservationPolicy.js";

export interface ReservationPolicyRepository {
  findByRestaurantId(restaurantId: string): Promise<ReservationPolicy | null>;
}

export class ReservationPolicyEvaluator implements AvailabilityEvaluator {
  readonly name = "reservation_policy";

  constructor(private readonly repository: ReservationPolicyRepository) {}

  async evaluate(context: AvailabilityContext): Promise<AvailabilityResult> {
    const { restaurantId, partySize, date } = context;

    const policy = await this.repository.findByRestaurantId(restaurantId);
    if (!policy) {
      return available();
    }

    if (!policy.enabled) {
      return unavailable("reservation_policy_disabled", { restaurantId });
    }

    if (partySize !== undefined) {
      if (partySize > policy.maxPartySize.value) {
        return unavailable("party_size_exceeds_maximum", {
          partySize,
          maxPartySize: policy.maxPartySize.value,
        });
      }

      if (partySize < policy.minPartySize.value) {
        return unavailable("party_size_below_minimum", {
          partySize,
          minPartySize: policy.minPartySize.value,
        });
      }
    }

    if (date) {
      const requestedDate = new Date(date + "T00:00:00Z");
      const now = new Date();
      const diffMs = requestedDate.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMinutes < policy.advanceBookingWindow.minMinutes) {
        return unavailable("advance_booking_window", {
          reason: "too_soon",
          minimumAdvanceMinutes: policy.advanceBookingWindow.minMinutes,
        });
      }

      if (diffDays > policy.advanceBookingWindow.maxDays) {
        return unavailable("advance_booking_window", {
          reason: "too_far",
          maximumAdvanceDays: policy.advanceBookingWindow.maxDays,
        });
      }
    }

    return available();
  }
}
