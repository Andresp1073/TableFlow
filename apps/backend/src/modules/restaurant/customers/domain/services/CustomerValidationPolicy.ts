import type { CustomerEmail } from "../models/CustomerEmail.js";
import type { CustomerPhone } from "../models/CustomerPhone.js";
import { CustomerValidationError } from "../../errors/CustomerValidationError.js";

export interface ContactInfo {
  email: CustomerEmail | null;
  phone: CustomerPhone | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class CustomerValidationPolicy {
  validateContactMethod(contact: ContactInfo): void {
    if (!contact.email && !contact.phone) {
      throw new CustomerValidationError(
        "At least one contact method (email or phone) is required",
      );
    }
  }

  validateForCreation(contact: ContactInfo): ValidationResult {
    const errors: string[] = [];

    if (!contact.email && !contact.phone) {
      errors.push("At least one contact method (email or phone) is required");
    }

    return { isValid: errors.length === 0, errors };
  }
}
