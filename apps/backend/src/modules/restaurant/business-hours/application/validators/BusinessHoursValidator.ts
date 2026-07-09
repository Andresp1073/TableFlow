import type { CreateBusinessHoursCommand } from "../commands/CreateBusinessHoursCommand.js";
import type { UpdateBusinessHoursCommand } from "../commands/UpdateBusinessHoursCommand.js";

export class CreateBusinessHoursValidator {
  validate(command: CreateBusinessHoursCommand): void {
    if (!command.restaurantId) {
      throw new Error("restaurantId is required");
    }
    if (!command.schedules || command.schedules.length === 0) {
      throw new Error("At least one schedule is required");
    }
  }
}

export class UpdateBusinessHoursValidator {
  validate(_command: UpdateBusinessHoursCommand): void {}
}
