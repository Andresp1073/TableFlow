import { AppError } from "../../../../errors/AppError.js";

export class DiningAreaDuplicateNameError extends AppError {
  constructor(name: string) {
    super(409, "dining_area.duplicate_name", `A dining area with name '${name}' already exists in this restaurant`);
    this.name = "DiningAreaDuplicateNameError";
    Object.setPrototypeOf(this, DiningAreaDuplicateNameError.prototype);
  }
}
