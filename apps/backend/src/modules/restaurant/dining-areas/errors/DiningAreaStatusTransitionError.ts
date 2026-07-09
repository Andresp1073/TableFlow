import { AppError } from "../../../../errors/AppError.js";

export class DiningAreaStatusTransitionError extends AppError {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      422,
      "dining_area.invalid_status_transition",
      `Cannot transition dining area from '${currentStatus}' to '${targetStatus}'`,
    );
    this.name = "DiningAreaStatusTransitionError";
    Object.setPrototypeOf(this, DiningAreaStatusTransitionError.prototype);
  }
}
