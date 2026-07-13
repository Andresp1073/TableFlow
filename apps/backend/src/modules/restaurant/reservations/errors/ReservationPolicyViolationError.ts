import { BusinessError } from "../../../../errors/BusinessError.js";

export class ReservationPolicyViolationError extends BusinessError {
  constructor(message: string) {
    super(message, "reservation.policy_violation");
    this.name = "ReservationPolicyViolationError";
    Object.setPrototypeOf(this, ReservationPolicyViolationError.prototype);
  }
}
