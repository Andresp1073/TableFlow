import type { CreateRestaurantSettingsCommand } from "../commands/CreateRestaurantSettingsCommand.js";
import type { UpdateRestaurantSettingsCommand } from "../commands/UpdateRestaurantSettingsCommand.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class CreateRestaurantSettingsValidator {
  validate(command: CreateRestaurantSettingsCommand): ValidationResult {
    const errors: string[] = [];

    if (!command.restaurantId) {
      errors.push("restaurantId is required");
    }

    return { valid: errors.length === 0, errors };
  }
}

export class UpdateRestaurantSettingsValidator {
  validate(command: UpdateRestaurantSettingsCommand): ValidationResult {
    const errors: string[] = [];

    if (!command.restaurantId) {
      errors.push("restaurantId is required");
    }

    return { valid: errors.length === 0, errors };
  }
}
