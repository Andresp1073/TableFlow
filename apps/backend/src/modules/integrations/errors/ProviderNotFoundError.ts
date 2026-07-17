import { AppError } from "../../../errors/AppError.js";

export class ProviderNotFoundError extends AppError {
  constructor(providerId: string) {
    super(404, "PROVIDER_NOT_FOUND", `Integration provider not found: ${providerId}`);
  }
}
