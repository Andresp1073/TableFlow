import { AppError } from "../../../errors/AppError.js";

export class AdapterNotFoundError extends AppError {
  constructor(adapterId: string) {
    super(404, "ADAPTER_NOT_FOUND", `Integration adapter not found: ${adapterId}`);
  }
}
