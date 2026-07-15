import { AppError } from "../../../errors/AppError.js";

export class KitchenTicketError extends AppError {
  constructor(message: string, code = "kitchen.ticket_error", statusCode = 400) {
    super(statusCode, code, message);
    this.name = "KitchenTicketError";
  }
}
