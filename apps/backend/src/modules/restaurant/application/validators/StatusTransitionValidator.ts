import type { RestaurantStatusValue } from "../../domain/models/RestaurantStatus.js";
import { RESTAURANT_STATUSES } from "../../domain/models/RestaurantStatus.js";

export interface StatusTransitionValidationError {
  field: string;
  message: string;
}

export class StatusTransitionValidator {
  validate(
    command: { id: string; reason?: string },
    targetStatus: RestaurantStatusValue,
  ): StatusTransitionValidationError[] {
    const errors: StatusTransitionValidationError[] = [];

    if (!command.id || command.id.trim().length === 0) {
      errors.push({ field: "id", message: "Restaurant ID is required" });
    }

    if (!RESTAURANT_STATUSES.includes(targetStatus)) {
      errors.push({
        field: "targetStatus",
        message: `Invalid target status "${targetStatus}". Allowed: ${RESTAURANT_STATUSES.join(", ")}`,
      });
    }

    return errors;
  }
}
