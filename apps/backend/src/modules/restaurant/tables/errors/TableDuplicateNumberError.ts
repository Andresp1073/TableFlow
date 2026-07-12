import { AppError } from "../../../../errors/AppError.js";

export class TableDuplicateNumberError extends AppError {
  constructor(tableNumber: string) {
    super(409, "table.duplicate_number", `A table with number '${tableNumber}' already exists in this restaurant`);
    this.name = "TableDuplicateNumberError";
    Object.setPrototypeOf(this, TableDuplicateNumberError.prototype);
  }
}
