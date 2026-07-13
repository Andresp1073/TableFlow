import { BusinessError } from "../../../../errors/BusinessError.js";

export class InvalidDimensionError extends BusinessError {
  constructor(message: string) {
    super(message, "floor_layout.invalid_dimension");
    this.name = "InvalidDimensionError";
    Object.setPrototypeOf(this, InvalidDimensionError.prototype);
  }
}
