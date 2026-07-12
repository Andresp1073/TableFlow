import { AppError } from "../../../../errors/AppError.js";

export class TableTypeDuplicateCodeError extends AppError {
  constructor(code: string) {
    super(409, "table_type.duplicate_code", `A table type with code '${code}' already exists in this restaurant`);
    this.name = "TableTypeDuplicateCodeError";
    Object.setPrototypeOf(this, TableTypeDuplicateCodeError.prototype);
  }
}
