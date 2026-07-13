import type { CustomerEmail } from "../models/CustomerEmail.js";
import type { CustomerPhone } from "../models/CustomerPhone.js";
import type { CustomerRepository } from "../repositories/CustomerRepository.js";
import { DuplicateCustomerError } from "../../errors/DuplicateCustomerError.js";

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  duplicateFields: string[];
}

export class CustomerDuplicatePolicy {
  constructor(private readonly repository: CustomerRepository) {}

  async checkEmail(email: CustomerEmail, restaurantId: string): Promise<void> {
    const existing = await this.repository.findByEmailAndRestaurant(email, restaurantId);
    if (existing) {
      throw new DuplicateCustomerError("email", email.value);
    }
  }

  async checkPhone(phone: CustomerPhone, restaurantId: string): Promise<void> {
    const existing = await this.repository.findByPhoneAndRestaurant(phone, restaurantId);
    if (existing) {
      throw new DuplicateCustomerError("phone", phone.value);
    }
  }

  async checkForCreation(
    email: CustomerEmail | null,
    phone: CustomerPhone | null,
    restaurantId: string,
  ): Promise<DuplicateCheckResult> {
    const duplicateFields: string[] = [];

    if (email) {
      const existingByEmail = await this.repository.findByEmailAndRestaurant(email, restaurantId);
      if (existingByEmail) {
        duplicateFields.push("email");
      }
    }

    if (phone) {
      const existingByPhone = await this.repository.findByPhoneAndRestaurant(phone, restaurantId);
      if (existingByPhone) {
        duplicateFields.push("phone");
      }
    }

    return {
      hasDuplicates: duplicateFields.length > 0,
      duplicateFields,
    };
  }
}
