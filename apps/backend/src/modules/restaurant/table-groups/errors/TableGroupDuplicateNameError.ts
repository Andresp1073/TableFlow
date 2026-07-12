import { ConflictError } from "../../../../errors/ConflictError.js";

export class TableGroupDuplicateNameError extends ConflictError {
  constructor(name: string) {
    super(`A table group with name "${name}" already exists`);
    this.name = "TableGroupDuplicateNameError";
    Object.setPrototypeOf(this, TableGroupDuplicateNameError.prototype);
  }
}
