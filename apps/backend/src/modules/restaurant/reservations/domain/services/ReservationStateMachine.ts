import type { ReservationStatusValue } from "../models/ReservationStatus.js";
import { ReservationStatus } from "../models/ReservationStatus.js";
import { ReservationStateTransitionError } from "../../errors/ReservationStateTransitionError.js";

export class ReservationStateMachine {
  canTransition(current: ReservationStatus, target: ReservationStatusValue): boolean {
    return current.isTransitionValid(target);
  }

  transition(current: ReservationStatus, target: ReservationStatusValue): ReservationStatus {
    if (!current.isTransitionValid(target)) {
      throw new ReservationStateTransitionError(current.value, target);
    }
    return ReservationStatus.create(target);
  }

  confirm(current: ReservationStatus): ReservationStatus {
    return this.transition(current, "confirmed");
  }

  checkIn(current: ReservationStatus): ReservationStatus {
    return this.transition(current, "checked_in");
  }

  seat(current: ReservationStatus): ReservationStatus {
    return this.transition(current, "seated");
  }

  complete(current: ReservationStatus): ReservationStatus {
    return this.transition(current, "completed");
  }

  cancel(current: ReservationStatus): ReservationStatus {
    return this.transition(current, "cancelled");
  }

  markNoShow(current: ReservationStatus): ReservationStatus {
    return this.transition(current, "no_show");
  }

  getAllowedTargets(current: ReservationStatus): ReservationStatusValue[] {
    return current.getAllowedTransitions();
  }

  isActive(current: ReservationStatus): boolean {
    return current.isActive();
  }

  isTerminal(current: ReservationStatus): boolean {
    return current.isTerminal();
  }
}
