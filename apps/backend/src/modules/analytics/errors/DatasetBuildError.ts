import { AppError } from "../../../errors/AppError.js";

export class DatasetBuildError extends AppError {
  constructor(datasetName: string, reason?: string) {
    super(
      422,
      "DATASET_BUILD_ERROR",
      `Failed to build dataset '${datasetName}'${reason ? `: ${reason}` : ""}`,
    );
  }
}
