import { AppError } from "../../../../errors/AppError.js";

export class TableNotFoundError extends AppError {
  constructor(id: string) {
    super(404, "table.not_found", `Table '${id}' not found`);
    this.name = "TableNotFoundError";
    Object.setPrototypeOf(this, TableNotFoundError.prototype);
  }
}
