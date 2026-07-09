import type { RestaurantStatus, RestaurantStatusValue } from "../models/RestaurantStatus.js";
import { InvalidRestaurantStateError } from "../../errors/InvalidRestaurantStateError.js";

export interface StatusTransition {
  from: RestaurantStatusValue;
  to: RestaurantStatusValue;
}

export const ALL_TRANSITIONS: StatusTransition[] = [
  { from: "draft", to: "pending" },
  { from: "draft", to: "active" },
  { from: "draft", to: "archived" },
  { from: "pending", to: "active" },
  { from: "pending", to: "draft" },
  { from: "active", to: "suspended" },
  { from: "active", to: "inactive" },
  { from: "suspended", to: "active" },
  { from: "suspended", to: "inactive" },
  { from: "inactive", to: "active" },
  { from: "inactive", to: "archived" },
];

export class RestaurantStatusPolicy {
  assertTransition(from: RestaurantStatus, to: RestaurantStatusValue): void {
    if (from.value === to) {
      throw new InvalidRestaurantStateError(
        `Restaurant is already in status "${from.value}"`
      );
    }

    if (!from.canTransitionTo(to)) {
      throw new InvalidRestaurantStateError(
        `Cannot transition restaurant from "${from.value}" to "${to}". ` +
        `Allowed transitions from "${from.value}": ${from.allowedTransitions().join(", ") || "(none)"}`
      );
    }
  }

  assertNotArchived(status: RestaurantStatus): void {
    if (status.isArchived()) {
      throw new InvalidRestaurantStateError(
        "Cannot modify an archived restaurant"
      );
    }
  }

  assertCanActivate(status: RestaurantStatus): void {
    if (!status.isPending() && !status.isInactive() && !status.isDraft()) {
      throw new InvalidRestaurantStateError(
        `Only draft, pending, or inactive restaurants can be activated. Current status: "${status.value}"`
      );
    }
  }

  assertCanSuspend(status: RestaurantStatus): void {
    if (!status.isActive()) {
      throw new InvalidRestaurantStateError(
        `Only active restaurants can be suspended. Current status: "${status.value}"`
      );
    }
  }

  assertCanArchive(status: RestaurantStatus): void {
    if (status.isDraft()) {
      return;
    }

    if (!status.isInactive()) {
      throw new InvalidRestaurantStateError(
        `Only draft or inactive restaurants can be archived. Current status: "${status.value}"`
      );
    }
  }
}
