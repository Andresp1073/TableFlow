import { AppError } from "../../../errors/AppError.js";

export class RestaurantInactiveError extends AppError {
  constructor(restaurantId: string) {
    super(409, "restaurant.inactive", `Restaurant '${restaurantId}' is inactive or suspended`);
    this.name = "RestaurantInactiveError";
  }
}
