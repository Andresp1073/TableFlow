import { RestaurantSlugAlreadyExistsError } from "../../errors/RestaurantSlugAlreadyExistsError.js";
import { RestaurantAlreadyExistsError } from "../../errors/RestaurantAlreadyExistsError.js";
import type { RestaurantEmail } from "../models/RestaurantEmail.js";
import type { RestaurantTaxId } from "../models/RestaurantTaxId.js";
import type { RestaurantSlug } from "../models/RestaurantSlug.js";

export interface UniquenessRepository {
  isSlugTaken(slug: string, excludeId?: string): Promise<boolean>;
  isEmailTaken(email: string, excludeId?: string): Promise<boolean>;
  isTaxIdTaken(taxId: string, excludeId?: string): Promise<boolean>;
}

export class RestaurantUniquenessValidator {
  constructor(private readonly repo: UniquenessRepository) {}

  async assertSlugUnique(slug: RestaurantSlug, excludeId?: string): Promise<void> {
    const taken = await this.repo.isSlugTaken(slug.value, excludeId);

    if (taken) {
      throw new RestaurantSlugAlreadyExistsError(slug.value);
    }
  }

  async assertEmailUnique(email: RestaurantEmail, excludeId?: string): Promise<void> {
    const taken = await this.repo.isEmailTaken(email.value, excludeId);

    if (taken) {
      throw new RestaurantAlreadyExistsError("email", email.value);
    }
  }

  async assertTaxIdUnique(taxId: RestaurantTaxId, excludeId?: string): Promise<void> {
    const taken = await this.repo.isTaxIdTaken(taxId.value, excludeId);

    if (taken) {
      throw new RestaurantAlreadyExistsError("taxId", taxId.value);
    }
  }
}
