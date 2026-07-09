import { AppError } from "../../../../errors/AppError.js";

export class AssetNotFoundError extends AppError {
  constructor(id: string) {
    super(404, "restaurant.asset.not_found", `Asset '${id}' not found`);
    this.name = "AssetNotFoundError";
  }
}
