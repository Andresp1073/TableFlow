import { AppError } from "../../../errors/AppError.js";

export class PaymentRefundError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(400, "payment.refund_failed", message, details);
    this.name = "PaymentRefundError";
  }
}
