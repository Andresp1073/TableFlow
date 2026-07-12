import { AppError } from "../../../../errors/AppError.js";

export class TableArchivedModificationError extends AppError {
  constructor(id: string) {
    super(409, "table.archived.modification", `Table '${id}' is archived and cannot be modified`);
    this.name = "TableArchivedModificationError";
    Object.setPrototypeOf(this, TableArchivedModificationError.prototype);
  }
}
