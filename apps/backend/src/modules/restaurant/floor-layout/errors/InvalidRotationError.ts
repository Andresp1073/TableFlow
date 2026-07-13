import { BusinessError } from "../../../../errors/BusinessError.js";

export class InvalidRotationError extends BusinessError {
  constructor(message: string) {
    super(message, "floor_layout.invalid_rotation");
    this.name = "InvalidRotationError";
    Object.setPrototypeOf(this, InvalidRotationError.prototype);
  }
}
