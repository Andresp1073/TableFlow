import { AppError } from "../../../errors/AppError.js";

export class IntegrationConnectionError extends AppError {
  constructor(message: string) {
    super(502, "INTEGRATION_CONNECTION_ERROR", message);
  }
}
