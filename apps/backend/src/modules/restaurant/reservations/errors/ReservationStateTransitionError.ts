import { BusinessError } from "../../../../errors/BusinessError.js";

export class ReservationStateTransitionError extends BusinessError {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      `Cannot transition reservation from "${currentStatus}" to "${targetStatus}"`,
      "reservation.invalid_transition",
    );
    this.name = "ReservationStateTransitionError";
    Object.setPrototypeOf(this, ReservationStateTransitionError.prototype);
  }
}
