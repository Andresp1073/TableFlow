import { NotFoundError } from "../../../../errors/NotFoundError.js";

export class CustomerNotFoundError extends NotFoundError {
  constructor(id: string) {
    super("Customer", "customer.not_found");
    this.name = "CustomerNotFoundError";
    Object.setPrototypeOf(this, CustomerNotFoundError.prototype);
  }
}
