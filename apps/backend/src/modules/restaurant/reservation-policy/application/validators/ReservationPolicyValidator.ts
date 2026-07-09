import type { CreateReservationPolicyCommand } from "../commands/CreateReservationPolicyCommand.js";
import type { UpdateReservationPolicyCommand } from "../commands/UpdateReservationPolicyCommand.js";

export class CreateReservationPolicyValidator {
  validate(command: CreateReservationPolicyCommand): void {
    if (!command.restaurantId) {
      throw new Error("restaurantId is required");
    }
  }
}

export class UpdateReservationPolicyValidator {
  validate(_command: UpdateReservationPolicyCommand): void {
  }
}
