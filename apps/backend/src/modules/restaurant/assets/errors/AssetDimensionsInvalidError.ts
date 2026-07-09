import { AppError } from "../../../../errors/AppError.js";

export class AssetDimensionsInvalidError extends AppError {
  constructor(width: number, height: number) {
    super(400, "restaurant.asset.dimensions_invalid", `Invalid image dimensions ${width}x${height}`);
    this.name = "AssetDimensionsInvalidError";
  }
}
