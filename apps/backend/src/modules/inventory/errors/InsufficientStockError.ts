import { AppError } from "../../../errors/AppError.js";

export class InsufficientStockError extends AppError {
  constructor(ingredientId: string, requested: number, available: number) {
    super(422, "inventory.insufficient_stock",
      `Insufficient stock for ingredient ${ingredientId}: requested ${requested}, available ${available}`);
    this.name = "InsufficientStockError";
  }
}
