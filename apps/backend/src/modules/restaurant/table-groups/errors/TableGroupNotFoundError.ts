import { NotFoundError } from "../../../../errors/NotFoundError.js";

export class TableGroupNotFoundError extends NotFoundError {
  constructor(id: string) {
    super("Table group", `table_group.not_found`);
    this.name = "TableGroupNotFoundError";
    Object.setPrototypeOf(this, TableGroupNotFoundError.prototype);
  }
}
