import { AppError } from "../../../../errors/AppError.js";

export class AssetLimitExceededError extends AppError {
  constructor(limit: number, type: string) {
    super(400, "restaurant.asset.limit_exceeded", `Maximum ${limit} assets of type '${type}' exceeded`);
    this.name = "AssetLimitExceededError";
  }
}
