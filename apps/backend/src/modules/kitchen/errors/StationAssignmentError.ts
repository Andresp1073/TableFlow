import { AppError } from "../../../errors/AppError.js";

export class StationAssignmentError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(422, "kitchen.station_assignment_failed", message, details);
    this.name = "StationAssignmentError";
  }
}
