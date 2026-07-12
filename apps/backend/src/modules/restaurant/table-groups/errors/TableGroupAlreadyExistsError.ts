import { ConflictError } from "../../../../errors/ConflictError.js";

export class TableGroupAlreadyExistsError extends ConflictError {
  constructor(name: string) {
    super(`A table group with name "${name}" already exists in this restaurant`);
    this.name = "TableGroupAlreadyExistsError";
    Object.setPrototypeOf(this, TableGroupAlreadyExistsError.prototype);
  }
}
