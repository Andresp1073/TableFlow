import { BusinessError } from "../../../../errors/BusinessError.js";

export class InvalidReservationTimeError extends BusinessError {
  constructor(message: string) {
    super(message, "reservation.invalid_time");
    this.name = "InvalidReservationTimeError";
    Object.setPrototypeOf(this, InvalidReservationTimeError.prototype);
  }
}
