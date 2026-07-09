import { AppError } from "../../../../errors/AppError.js";

export class AssetFileTooLargeError extends AppError {
  constructor(size: number, maxSize: number) {
    super(400, "restaurant.asset.file_too_large", `File size ${size} exceeds maximum ${maxSize}`);
    this.name = "AssetFileTooLargeError";
  }
}
