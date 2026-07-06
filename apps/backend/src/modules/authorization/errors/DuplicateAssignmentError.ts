import { AppError } from "../../../errors/AppError.js";

export class DuplicateAssignmentError extends AppError {
  constructor(message: string) {
    super(409, "authz.assignment.duplicate", message);
    this.name = "DuplicateAssignmentError";
  }
}
