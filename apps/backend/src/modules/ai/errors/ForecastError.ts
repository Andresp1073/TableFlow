import { AppError } from "../../../errors/AppError.js";

export class ForecastError extends AppError {
  constructor(message: string) {
    super(422, "FORECAST_ERROR", message);
  }
}
