import { AppError } from "../../../errors/AppError.js";

export class SafetyViolationError extends AppError {
  constructor(message: string) {
    super(400, "SAFETY_VIOLATION_ERROR", message);
  }
}
