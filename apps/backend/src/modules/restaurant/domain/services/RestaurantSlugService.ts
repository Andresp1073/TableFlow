import type { RestaurantSlug } from "../models/RestaurantSlug.js";

export interface SlugUniquenessChecker {
  isSlugTaken(slug: string, excludeId?: string): Promise<boolean>;
}

export class RestaurantSlugService {
  constructor(private readonly uniquenessChecker: SlugUniquenessChecker) {}

  generateFromName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async ensureUnique(slug: RestaurantSlug, excludeId?: string): Promise<RestaurantSlug> {
    const taken = await this.uniquenessChecker.isSlugTaken(slug.value, excludeId);

    if (taken) {
      throw new Error(`Restaurant slug "${slug.value}" is already taken`);
    }

    return slug;
  }

  async findAvailableSlug(baseName: string, excludeId?: string): Promise<string> {
    const base = this.generateFromName(baseName);

    if (base.length === 0) {
      throw new Error("Cannot generate a slug from the provided name");
    }

    const taken = await this.uniquenessChecker.isSlugTaken(base, excludeId);

    if (!taken) {
      return base;
    }

    let counter = 1;
    const maxAttempts = 100;

    while (counter <= maxAttempts) {
      const candidate = `${base}-${counter}`;

      if (candidate.length > 100) {
        throw new Error("Unable to generate a unique slug — base name too long");
      }

      const isTaken = await this.uniquenessChecker.isSlugTaken(candidate, excludeId);

      if (!isTaken) {
        return candidate;
      }

      counter++;
    }

    throw new Error("Unable to generate a unique slug after 100 attempts");
  }
}
