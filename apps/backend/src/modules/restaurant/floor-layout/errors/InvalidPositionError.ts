import { BusinessError } from "../../../../errors/BusinessError.js";

export class InvalidPositionError extends BusinessError {
  constructor(message: string) {
    super(message, "floor_layout.invalid_position");
    this.name = "InvalidPositionError";
    Object.setPrototypeOf(this, InvalidPositionError.prototype);
  }
}
