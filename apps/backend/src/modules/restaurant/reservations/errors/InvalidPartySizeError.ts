import { BusinessError } from "../../../../errors/BusinessError.js";

export class InvalidPartySizeError extends BusinessError {
  constructor(message: string) {
    super(message, "reservation.invalid_party_size");
    this.name = "InvalidPartySizeError";
    Object.setPrototypeOf(this, InvalidPartySizeError.prototype);
  }
}
