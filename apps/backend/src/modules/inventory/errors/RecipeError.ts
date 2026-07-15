import { AppError } from "../../../errors/AppError.js";

export class RecipeError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(400, "inventory.recipe_error", message, details);
    this.name = "RecipeError";
  }
}
