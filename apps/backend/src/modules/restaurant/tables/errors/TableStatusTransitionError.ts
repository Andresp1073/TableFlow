import { AppError } from "../../../../errors/AppError.js";

export class TableStatusTransitionError extends AppError {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      422,
      "table.invalid_status_transition",
      `Cannot transition table from '${currentStatus}' to '${targetStatus}'`,
    );
    this.name = "TableStatusTransitionError";
    Object.setPrototypeOf(this, TableStatusTransitionError.prototype);
  }
}
