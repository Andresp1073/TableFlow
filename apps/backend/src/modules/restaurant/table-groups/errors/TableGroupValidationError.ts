import { AppError } from "../../../../errors/AppError.js";

export class TableGroupValidationError extends AppError {
  constructor(message: string) {
    super(400, "validation.failed", message);
    this.name = "TableGroupValidationError";
    Object.setPrototypeOf(this, TableGroupValidationError.prototype);
  }
}
