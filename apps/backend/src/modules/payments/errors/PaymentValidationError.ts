import { AppError } from "../../../errors/AppError.js";

export class PaymentValidationError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(422, "payment.validation_failed", message, details);
    this.name = "PaymentValidationError";
  }
}
