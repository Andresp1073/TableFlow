import { AppError } from "../../../errors/AppError.js";

export class InvalidRoleAssignmentError extends AppError {
  constructor(message: string) {
    super(400, "authz.assignment.invalid", message);
    this.name = "InvalidRoleAssignmentError";
  }
}
