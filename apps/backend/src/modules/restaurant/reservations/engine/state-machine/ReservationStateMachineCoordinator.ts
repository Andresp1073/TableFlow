import type { ReservationStatusValue } from "../../domain/models/ReservationStatus.js";
import { ReservationStatus } from "../../domain/models/ReservationStatus.js";
import { ReservationStateMachine } from "../../domain/services/ReservationStateMachine.js";
import { ReservationStateTransitionError } from "../../errors/ReservationStateTransitionError.js";

export class ReservationStateMachineCoordinator {
  private readonly stateMachine = new ReservationStateMachine();

  transition(current: ReservationStatus, target: ReservationStatusValue): ReservationStatus {
    return this.stateMachine.transition(current, target);
  }

  confirm(current: ReservationStatus): ReservationStatus {
    return this.stateMachine.confirm(current);
  }

  cancel(current: ReservationStatus): ReservationStatus {
    return this.stateMachine.cancel(current);
  }

  checkIn(current: ReservationStatus): ReservationStatus {
    return this.stateMachine.checkIn(current);
  }

  seat(current: ReservationStatus): ReservationStatus {
    return this.stateMachine.seat(current);
  }

  complete(current: ReservationStatus): ReservationStatus {
    return this.stateMachine.complete(current);
  }

  markNoShow(current: ReservationStatus): ReservationStatus {
    return this.stateMachine.markNoShow(current);
  }

  canTransition(current: ReservationStatus, target: ReservationStatusValue): boolean {
    return this.stateMachine.canTransition(current, target);
  }

  getAllowedTargets(current: ReservationStatus): ReservationStatusValue[] {
    return this.stateMachine.getAllowedTargets(current);
  }

  isActive(current: ReservationStatus): boolean {
    return this.stateMachine.isActive(current);
  }

  isTerminal(current: ReservationStatus): boolean {
    return this.stateMachine.isTerminal(current);
  }

  requireTransition(current: ReservationStatus, target: ReservationStatusValue): ReservationStatus {
    if (!this.stateMachine.canTransition(current, target)) {
      throw new ReservationStateTransitionError(current.value, target);
    }
    return this.stateMachine.transition(current, target);
  }
}
