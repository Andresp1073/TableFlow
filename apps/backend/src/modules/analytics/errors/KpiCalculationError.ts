import { AppError } from "../../../errors/AppError.js";

export class KpiCalculationError extends AppError {
  constructor(kpiName: string, reason?: string) {
    super(
      422,
      "KPI_CALCULATION_ERROR",
      `Failed to calculate KPI '${kpiName}'${reason ? `: ${reason}` : ""}`,
    );
  }
}
