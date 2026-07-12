import { AppError } from "../../../../errors/AppError.js";

export class TableTypeStatusTransitionError extends AppError {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      422,
      "table_type.invalid_status_transition",
      `Cannot transition table type from '${currentStatus}' to '${targetStatus}'`,
    );
    this.name = "TableTypeStatusTransitionError";
    Object.setPrototypeOf(this, TableTypeStatusTransitionError.prototype);
  }
}
