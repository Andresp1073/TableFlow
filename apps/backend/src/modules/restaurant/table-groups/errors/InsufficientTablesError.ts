import { BusinessError } from "../../../../errors/BusinessError.js";

export class InsufficientTablesError extends BusinessError {
  constructor(actualCount: number) {
    super(
      `A table group requires at least 2 tables, but only ${actualCount} ${actualCount === 1 ? "was" : "were"} provided`,
      "table_group.insufficient_tables",
    );
    this.name = "InsufficientTablesError";
    Object.setPrototypeOf(this, InsufficientTablesError.prototype);
  }
}
