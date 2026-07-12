import { AppError } from "../../../../errors/AppError.js";

export class TableDeletedError extends AppError {
  constructor(id: string) {
    super(410, "table.deleted", `Table '${id}' has been deleted`);
    this.name = "TableDeletedError";
    Object.setPrototypeOf(this, TableDeletedError.prototype);
  }
}
