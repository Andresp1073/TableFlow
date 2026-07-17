import { AppError } from "../../../errors/AppError.js";

export class RecommendationError extends AppError {
  constructor(message: string) {
    super(422, "RECOMMENDATION_ERROR", message);
  }
}
