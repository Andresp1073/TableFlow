import { AppError } from "../../../../errors/AppError.js";

export class BusinessHoursNotFoundError extends AppError {
  constructor(restaurantId: string) {
    super(
      404,
      "business_hours.not_found",
      `Business hours for restaurant '${restaurantId}' not found`,
    );
    this.name = "BusinessHoursNotFoundError";
  }
}
