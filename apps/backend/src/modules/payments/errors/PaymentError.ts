import { AppError } from "../../../errors/AppError.js";

export class PaymentError extends AppError {
  constructor(message: string, code = "payment.error", statusCode = 400) {
    super(statusCode, code, message);
    this.name = "PaymentError";
  }
}
