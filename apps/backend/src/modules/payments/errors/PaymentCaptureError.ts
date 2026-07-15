import { AppError } from "../../../errors/AppError.js";

export class PaymentCaptureError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(402, "payment.capture_failed", message, details);
    this.name = "PaymentCaptureError";
  }
}
