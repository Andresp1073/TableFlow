import { AppError } from "../../../../errors/AppError.js";

export class TableTypeInvalidCapacityRangeError extends AppError {
  constructor(message: string) {
    super(422, "table_type.invalid_capacity_range", message);
    this.name = "TableTypeInvalidCapacityRangeError";
    Object.setPrototypeOf(this, TableTypeInvalidCapacityRangeError.prototype);
  }
}
