import { AppError } from "../../../errors/AppError.js";

export class AssignmentNotFoundError extends AppError {
  constructor(assignmentId: string) {
    super(404, "authz.assignment.not_found", `Role assignment not found: ${assignmentId}`);
    this.name = "AssignmentNotFoundError";
  }
}
