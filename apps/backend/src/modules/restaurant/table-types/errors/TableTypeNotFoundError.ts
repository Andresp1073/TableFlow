import { AppError } from "../../../../errors/AppError.js";

export class TableTypeNotFoundError extends AppError {
  constructor(id: string) {
    super(404, "table_type.not_found", `Table type '${id}' not found`);
    this.name = "TableTypeNotFoundError";
    Object.setPrototypeOf(this, TableTypeNotFoundError.prototype);
  }
}
