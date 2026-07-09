import { AppError } from "../../../errors/AppError.js";

export class RestaurantArchivedError extends AppError {
  constructor(restaurantId: string) {
    super(409, "restaurant.archived", `Restaurant '${restaurantId}' is archived`);
    this.name = "RestaurantArchivedError";
  }
}
