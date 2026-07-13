import type { CreateCustomerRequest, UpdateCustomerRequest } from "../dto/CustomerRequestDTO.js";
import { CustomerValidationError } from "../../errors/CustomerValidationError.js";

export class CustomerValidator {
  validateCreateRequest(request: CreateCustomerRequest): void {
    if (!request.restaurantId || request.restaurantId.trim() === "") {
      throw new CustomerValidationError("restaurantId is required");
    }

    if (!request.firstName || request.firstName.trim() === "") {
      throw new CustomerValidationError("firstName is required");
    }

    if (request.firstName.trim().length > 100) {
      throw new CustomerValidationError("firstName must not exceed 100 characters");
    }

    if (!request.lastName || request.lastName.trim() === "") {
      throw new CustomerValidationError("lastName is required");
    }

    if (request.lastName.trim().length > 100) {
      throw new CustomerValidationError("lastName must not exceed 100 characters");
    }

    if (!request.email && !request.phone) {
      throw new CustomerValidationError("At least one of email or phone is required");
    }
  }

  validateUpdateRequest(request: UpdateCustomerRequest): void {
    if (request.firstName !== undefined) {
      if (request.firstName.trim() === "") {
        throw new CustomerValidationError("firstName must not be empty");
      }
      if (request.firstName.trim().length > 100) {
        throw new CustomerValidationError("firstName must not exceed 100 characters");
      }
    }

    if (request.lastName !== undefined) {
      if (request.lastName.trim() === "") {
        throw new CustomerValidationError("lastName must not be empty");
      }
      if (request.lastName.trim().length > 100) {
        throw new CustomerValidationError("lastName must not exceed 100 characters");
      }
    }
  }
}
