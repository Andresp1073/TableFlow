import { AppError } from "../../../errors/AppError.js";

export class PaymentProviderError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(502, "payment.provider_error", message, details);
    this.name = "PaymentProviderError";
  }
}
