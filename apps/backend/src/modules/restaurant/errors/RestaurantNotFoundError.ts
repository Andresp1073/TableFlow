import { AppError } from "../../../errors/AppError.js";

export class RestaurantNotFoundError extends AppError {
  constructor(identifier: string) {
    super(404, "restaurant.not_found", `Restaurant '${identifier}' not found`);
    this.name = "RestaurantNotFoundError";
  }
}
