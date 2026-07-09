import { AppError } from "../../../errors/AppError.js";

export class RestaurantSlugAlreadyExistsError extends AppError {
  constructor(slug: string) {
    super(409, "restaurant.slug_already_exists", `Restaurant slug '${slug}' is already taken`);
    this.name = "RestaurantSlugAlreadyExistsError";
  }
}
