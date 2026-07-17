import { AppError } from "../../../errors/AppError.js";

export class IntegrationConfigError extends AppError {
  constructor(message: string) {
    super(400, "INTEGRATION_CONFIG_ERROR", message);
  }
}
