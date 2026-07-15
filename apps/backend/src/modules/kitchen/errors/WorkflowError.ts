import { AppError } from "../../../errors/AppError.js";

export class WorkflowError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(400, "kitchen.workflow_error", message, details);
    this.name = "WorkflowError";
  }
}
