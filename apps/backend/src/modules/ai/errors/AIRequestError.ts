import { AppError } from "../../../errors/AppError.js";

export class AIRequestError extends AppError {
  constructor(message: string) {
    super(400, "AI_REQUEST_ERROR", message);
  }
}
