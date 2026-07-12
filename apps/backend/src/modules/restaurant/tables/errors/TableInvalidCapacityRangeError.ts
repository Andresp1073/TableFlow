import { AppError } from "../../../../errors/AppError.js";

export class TableInvalidCapacityRangeError extends AppError {
  constructor(message: string) {
    super(422, "table.invalid_capacity_range", message);
    this.name = "TableInvalidCapacityRangeError";
    Object.setPrototypeOf(this, TableInvalidCapacityRangeError.prototype);
  }
}
