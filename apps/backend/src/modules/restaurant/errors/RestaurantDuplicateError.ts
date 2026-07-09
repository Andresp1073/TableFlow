import { AppError } from "../../../errors/AppError.js";

export class RestaurantDuplicateError extends AppError {
  constructor(field: string, value: string) {
    super(409, "restaurant.duplicate", `Restaurant with ${field} '${value}' already exists`);
    this.name = "RestaurantDuplicateError";
  }
}
