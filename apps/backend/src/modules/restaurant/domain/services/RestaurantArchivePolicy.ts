import type { Restaurant } from "../models/Restaurant.js";
import { InvalidRestaurantStateError } from "../../errors/InvalidRestaurantStateError.js";

export class RestaurantArchivePolicy {
  assertCanArchive(restaurant: Restaurant): void {
    if (restaurant.deletedAt !== null) {
      throw new InvalidRestaurantStateError("Restaurant is already archived (deleted)");
    }

    if (restaurant.status.isArchived()) {
      throw new InvalidRestaurantStateError("Restaurant is already archived");
    }

    if (!restaurant.status.isDraft() && !restaurant.status.isInactive()) {
      throw new InvalidRestaurantStateError(
        `Only draft or inactive restaurants can be archived. Current status: "${restaurant.status.value}". ` +
        "Deactivate the restaurant before archiving."
      );
    }
  }

  assertCanSoftDelete(restaurant: Restaurant): void {
    if (restaurant.deletedAt !== null) {
      throw new InvalidRestaurantStateError("Restaurant is already deleted");
    }

    if (!restaurant.status.isArchived()) {
      throw new InvalidRestaurantStateError(
        `Restaurant must be archived before soft deletion. Current status: "${restaurant.status.value}"`
      );
    }
  }

  assertNotDeleted(restaurant: Pick<Restaurant, "deletedAt">): void {
    if (restaurant.deletedAt !== null) {
      throw new InvalidRestaurantStateError("Restaurant is deleted");
    }
  }

  prepareSoftDelete(restaurant: Restaurant, deletedBy: string): { deletedAt: Date; deletedBy: string } {
    this.assertCanSoftDelete(restaurant);

    return {
      deletedAt: new Date(),
      deletedBy,
    };
  }
}
