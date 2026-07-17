import { AppError } from "../../../errors/AppError.js";

export class MetricCalculationError extends AppError {
  constructor(metricName: string, reason?: string) {
    super(
      422,
      "METRIC_CALCULATION_ERROR",
      `Failed to calculate metric '${metricName}'${reason ? `: ${reason}` : ""}`,
    );
  }
}
