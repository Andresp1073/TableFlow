import { AppError } from "../../../../errors/AppError.js";

export class DiningAreaNotFoundError extends AppError {
  constructor(id: string) {
    super(404, "dining_area.not_found", `Dining area '${id}' not found`);
    this.name = "DiningAreaNotFoundError";
    Object.setPrototypeOf(this, DiningAreaNotFoundError.prototype);
  }
}
