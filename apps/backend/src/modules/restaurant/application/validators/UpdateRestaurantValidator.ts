import {
  validateRestaurantName,
  validateRestaurantSlug,
  validateRestaurantEmail,
  validateRestaurantTaxId,
  validateRestaurantPhone,
} from "../../domain/validation/RestaurantRules.js";
import type { ValidationError } from "../../domain/validation/RestaurantRules.js";
import type { UpdateRestaurantCommand } from "../commands/UpdateRestaurantCommand.js";

export class UpdateRestaurantValidator {
  validate(command: UpdateRestaurantCommand): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!command.id || command.id.trim().length === 0) {
      errors.push({ field: "id", message: "Restaurant ID is required" });
    }

    if (command.name !== undefined) {
      const nameError = validateRestaurantName(command.name);
      if (nameError) errors.push(nameError);
    }

    if (command.slug !== undefined) {
      const slugError = validateRestaurantSlug(command.slug);
      if (slugError) errors.push(slugError);
    }

    if (command.email !== undefined) {
      if (command.email === null) {
        errors.push({ field: "email", message: "Email cannot be set to null once provided" });
      } else {
        const emailError = validateRestaurantEmail(command.email);
        if (emailError) errors.push(emailError);
      }
    }

    if (command.taxId !== undefined) {
      if (command.taxId === null) {
        errors.push({ field: "taxId", message: "Tax ID cannot be set to null once provided" });
      } else {
        const taxIdError = validateRestaurantTaxId(command.taxId);
        if (taxIdError) errors.push(taxIdError);
      }
    }

    if (command.phone !== undefined && command.phone !== null) {
      const phoneError = validateRestaurantPhone(command.phone);
      if (phoneError) errors.push(phoneError);
    }

    return errors;
  }
}
