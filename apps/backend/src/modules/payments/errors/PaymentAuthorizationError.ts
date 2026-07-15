import { AppError } from "../../../errors/AppError.js";

export class PaymentAuthorizationError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(402, "payment.authorization_failed", message, details);
    this.name = "PaymentAuthorizationError";
  }
}
