import { AppError } from "../../../errors/AppError.js";

export class UnauthorizedRestaurantAccessError extends AppError {
  constructor() {
    super(403, "authz.restaurant.access_denied", "You do not have access to this restaurant");
    this.name = "UnauthorizedRestaurantAccessError";
  }
}
