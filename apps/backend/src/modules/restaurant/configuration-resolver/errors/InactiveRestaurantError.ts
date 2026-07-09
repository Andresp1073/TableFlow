import { AppError } from "../../../../errors/AppError.js";

export class InactiveRestaurantError extends AppError {
  constructor(restaurantId: string, status: string) {
    super(
      409,
      "restaurant.inactive",
      `Cannot access configuration for restaurant '${restaurantId}' with status '${status}'`,
    );
    this.name = "InactiveRestaurantError";
  }
}
