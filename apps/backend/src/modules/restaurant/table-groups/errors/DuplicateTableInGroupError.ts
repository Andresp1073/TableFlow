import { ConflictError } from "../../../../errors/ConflictError.js";

export class DuplicateTableInGroupError extends ConflictError {
  constructor(tableId: string) {
    super(`Table "${tableId}" appears more than once in the group`);
    this.name = "DuplicateTableInGroupError";
    Object.setPrototypeOf(this, DuplicateTableInGroupError.prototype);
  }
}
