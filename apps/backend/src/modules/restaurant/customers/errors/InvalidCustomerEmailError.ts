import { BusinessError } from "../../../../errors/BusinessError.js";

export class InvalidCustomerEmailError extends BusinessError {
  constructor(message: string) {
    super(message, "customer.invalid_email");
    this.name = "InvalidCustomerEmailError";
    Object.setPrototypeOf(this, InvalidCustomerEmailError.prototype);
  }
}
