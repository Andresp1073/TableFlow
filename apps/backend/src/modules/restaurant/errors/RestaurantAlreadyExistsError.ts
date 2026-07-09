import { AppError } from "../../../errors/AppError.js";

export class RestaurantAlreadyExistsError extends AppError {
  constructor(field: string, value: string) {
    super(409, "restaurant.already_exists", `Restaurant with ${field} '${value}' already exists`);
    this.name = "RestaurantAlreadyExistsError";
  }
}
