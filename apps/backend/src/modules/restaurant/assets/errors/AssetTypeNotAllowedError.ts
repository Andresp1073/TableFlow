import { AppError } from "../../../../errors/AppError.js";

export class AssetTypeNotAllowedError extends AppError {
  constructor(type: string) {
    super(400, "restaurant.asset.type_not_allowed", `Asset type '${type}' is not allowed`);
    this.name = "AssetTypeNotAllowedError";
  }
}
