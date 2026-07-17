import { AppError } from "../../../errors/AppError.js";

export class AnalyticsQueryError extends AppError {
  constructor(message: string) {
    super(400, "ANALYTICS_QUERY_ERROR", message);
  }
}
