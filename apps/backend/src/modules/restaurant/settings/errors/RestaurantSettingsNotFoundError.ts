import { AppError } from "../../../../errors/AppError.js";

export class RestaurantSettingsNotFoundError extends AppError {
  constructor(restaurantId: string) {
    super(404, "restaurant.settings.not_found", `Settings for restaurant '${restaurantId}' not found`);
    this.name = "RestaurantSettingsNotFoundError";
  }
}
