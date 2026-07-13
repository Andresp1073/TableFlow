import { ConflictError } from "../../../../errors/ConflictError.js";

export class DuplicateCustomerError extends ConflictError {
  constructor(field: string, value: string) {
    super(
      `A customer with ${field} "${value}" already exists in this restaurant`,
    );
    this.name = "DuplicateCustomerError";
    Object.setPrototypeOf(this, DuplicateCustomerError.prototype);
  }
}
