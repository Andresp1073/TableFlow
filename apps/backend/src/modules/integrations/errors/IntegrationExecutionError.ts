import { AppError } from "../../../errors/AppError.js";

export class IntegrationExecutionError extends AppError {
  constructor(message: string) {
    super(502, "INTEGRATION_EXECUTION_ERROR", message);
  }
}
