import { AppError } from "../../../../errors/AppError.js";

export class CustomerValidationError extends AppError {
  constructor(message: string) {
    super(400, "customer.validation_failed", message);
    this.name = "CustomerValidationError";
    Object.setPrototypeOf(this, CustomerValidationError.prototype);
  }
}
