import { NotFoundError } from "../../../../errors/NotFoundError.js";

export class ReservationNotFoundError extends NotFoundError {
  constructor(id: string) {
    super("Reservation", "reservation.not_found");
    this.name = "ReservationNotFoundError";
    Object.setPrototypeOf(this, ReservationNotFoundError.prototype);
  }
}
