import type { Restaurant } from "../models/Restaurant.js";
import { InvalidRestaurantStateError } from "../../errors/InvalidRestaurantStateError.js";

export interface ActivationRequirements {
  nameFilled: boolean;
  slugFilled: boolean;
  timezoneValid: boolean;
  currencyValid: boolean;
  languageValid: boolean;
}

export class RestaurantActivationPolicy {
  assertCanSubmitForReview(restaurant: Restaurant): void {
    if (!restaurant.status.isDraft()) {
      throw new InvalidRestaurantStateError(
        `Only draft restaurants can be submitted for review. Current status: "${restaurant.status.value}"`
      );
    }

    const missing: string[] = [];

    if (!restaurant.name) missing.push("name");
    if (!restaurant.slug) missing.push("slug");
    if (!restaurant.timezone) missing.push("timezone");
    if (!restaurant.currency) missing.push("currency");
    if (!restaurant.language) missing.push("language");

    if (missing.length > 0) {
      throw new InvalidRestaurantStateError(
        `Cannot submit restaurant for review. Missing required fields: ${missing.join(", ")}`
      );
    }
  }

  assertCanApprove(restaurant: Restaurant): void {
    if (!restaurant.status.isPending()) {
      throw new InvalidRestaurantStateError(
        `Only pending restaurants can be approved. Current status: "${restaurant.status.value}"`
      );
    }
  }

  assertCanReject(restaurant: Restaurant): void {
    if (!restaurant.status.isPending()) {
      throw new InvalidRestaurantStateError(
        `Only pending restaurants can be rejected. Current status: "${restaurant.status.value}"`
      );
    }
  }

  assertCanReactivate(restaurant: Restaurant): void {
    if (!restaurant.status.isInactive() && !restaurant.status.isSuspended()) {
      throw new InvalidRestaurantStateError(
        `Only inactive or suspended restaurants can be reactivated. Current status: "${restaurant.status.value}"`
      );
    }
  }

  checkPrerequisites(restaurant: Restaurant): ActivationRequirements {
    return {
      nameFilled: !!restaurant.name,
      slugFilled: !!restaurant.slug,
      timezoneValid: !!restaurant.timezone,
      currencyValid: !!restaurant.currency,
      languageValid: !!restaurant.language,
    };
  }
}
