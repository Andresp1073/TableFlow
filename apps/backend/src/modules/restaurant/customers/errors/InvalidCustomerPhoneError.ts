import { BusinessError } from "../../../../errors/BusinessError.js";

export class InvalidCustomerPhoneError extends BusinessError {
  constructor(message: string) {
    super(message, "customer.invalid_phone");
    this.name = "InvalidCustomerPhoneError";
    Object.setPrototypeOf(this, InvalidCustomerPhoneError.prototype);
  }
}
