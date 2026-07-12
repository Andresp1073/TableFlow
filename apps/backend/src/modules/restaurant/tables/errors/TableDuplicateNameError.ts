import { AppError } from "../../../../errors/AppError.js";

export class TableDuplicateNameError extends AppError {
  constructor(name: string) {
    super(409, "table.duplicate_name", `A table with name '${name}' already exists in this restaurant`);
    this.name = "TableDuplicateNameError";
    Object.setPrototypeOf(this, TableDuplicateNameError.prototype);
  }
}
