import { AppError } from "../../../../errors/AppError.js";

export class DiningAreaDuplicateCodeError extends AppError {
  constructor(code: string) {
    super(409, "dining_area.duplicate_code", `A dining area with code '${code}' already exists in this restaurant`);
    this.name = "DiningAreaDuplicateCodeError";
    Object.setPrototypeOf(this, DiningAreaDuplicateCodeError.prototype);
  }
}
