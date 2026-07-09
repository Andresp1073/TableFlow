import { AppError } from "../../../../errors/AppError.js";

export class ReservationPolicyNotFoundError extends AppError {
  constructor(restaurantId: string) {
    super(404, "reservation_policy.not_found", `Reservation policy for restaurant '${restaurantId}' not found`);
    this.name = "ReservationPolicyNotFoundError";
  }
}
