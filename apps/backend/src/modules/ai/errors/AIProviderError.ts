import { AppError } from "../../../errors/AppError.js";

export class AIProviderError extends AppError {
  constructor(message: string) {
    super(502, "AI_PROVIDER_ERROR", message);
  }
}
