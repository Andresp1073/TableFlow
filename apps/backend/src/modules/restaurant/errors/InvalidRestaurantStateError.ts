import { AppError } from "../../../errors/AppError.js";

export class InvalidRestaurantStateError extends AppError {
  constructor(message: string) {
    super(422, "restaurant.invalid_state", message);
    this.name = "InvalidRestaurantStateError";
  }
}
