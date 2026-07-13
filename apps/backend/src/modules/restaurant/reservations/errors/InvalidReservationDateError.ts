import { BusinessError } from "../../../../errors/BusinessError.js";

export class InvalidReservationDateError extends BusinessError {
  constructor(message: string) {
    super(message, "reservation.invalid_date");
    this.name = "InvalidReservationDateError";
    Object.setPrototypeOf(this, InvalidReservationDateError.prototype);
  }
}
