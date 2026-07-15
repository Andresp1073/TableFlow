import { AppError } from "../../../errors/AppError.js";

export class PurchaseOrderError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(400, "inventory.purchase_order_error", message, details);
    this.name = "PurchaseOrderError";
  }
}
