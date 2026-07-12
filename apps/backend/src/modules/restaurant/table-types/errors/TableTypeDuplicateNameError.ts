import { AppError } from "../../../../errors/AppError.js";

export class TableTypeDuplicateNameError extends AppError {
  constructor(name: string) {
    super(409, "table_type.duplicate_name", `A table type with name '${name}' already exists in this restaurant`);
    this.name = "TableTypeDuplicateNameError";
    Object.setPrototypeOf(this, TableTypeDuplicateNameError.prototype);
  }
}
