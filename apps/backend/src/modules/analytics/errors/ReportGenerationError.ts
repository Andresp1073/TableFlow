import { AppError } from "../../../errors/AppError.js";

export class ReportGenerationError extends AppError {
  constructor(reportName: string, reason?: string) {
    super(
      422,
      "REPORT_GENERATION_ERROR",
      `Failed to generate report '${reportName}'${reason ? `: ${reason}` : ""}`,
    );
  }
}
