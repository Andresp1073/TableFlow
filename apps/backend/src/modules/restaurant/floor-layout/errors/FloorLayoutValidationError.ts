import { AppError } from "../../../../errors/AppError.js";

export class FloorLayoutValidationError extends AppError {
  constructor(message: string) {
    super(400, "floor_layout.validation_failed", message);
    this.name = "FloorLayoutValidationError";
    Object.setPrototypeOf(this, FloorLayoutValidationError.prototype);
  }
}
