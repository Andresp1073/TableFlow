import {
  validateRestaurantName,
  validateRestaurantSlug,
  validateRestaurantEmail,
  validateRestaurantTaxId,
  validateRestaurantPhone,
} from "../../domain/validation/RestaurantRules.js";
import type { ValidationError } from "../../domain/validation/RestaurantRules.js";
import type { CreateRestaurantCommand } from "../commands/CreateRestaurantCommand.js";

export class CreateRestaurantValidator {
  validate(command: CreateRestaurantCommand): ValidationError[] {
    const errors: ValidationError[] = [];

    const nameError = validateRestaurantName(command.name);
    if (nameError) errors.push(nameError);

    const slugError = validateRestaurantSlug(command.slug);
    if (slugError) errors.push(slugError);

    if (command.email !== undefined && command.email !== null) {
      const emailError = validateRestaurantEmail(command.email);
      if (emailError) errors.push(emailError);
    }

    if (command.taxId !== undefined && command.taxId !== null) {
      const taxIdError = validateRestaurantTaxId(command.taxId);
      if (taxIdError) errors.push(taxIdError);
    }

    if (command.phone !== undefined && command.phone !== null) {
      const phoneError = validateRestaurantPhone(command.phone);
      if (phoneError) errors.push(phoneError);
    }

    return errors;
  }
}
