const MAX_LENGTH = 100;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class RestaurantSlug {
  private constructor(public readonly value: string) {}

  static create(value: string): RestaurantSlug {
    const trimmed = value.trim().toLowerCase();

    if (trimmed.length === 0) {
      throw new Error("Restaurant slug cannot be empty");
    }

    if (trimmed.length > MAX_LENGTH) {
      throw new Error(`Restaurant slug cannot exceed ${MAX_LENGTH} characters`);
    }

    if (!SLUG_PATTERN.test(trimmed)) {
      throw new Error(
        "Restaurant slug must contain only lowercase letters, numbers, and hyphens (no leading/trailing/double hyphens)"
      );
    }

    return new RestaurantSlug(trimmed);
  }

  static reconstitute(value: string): RestaurantSlug {
    return new RestaurantSlug(value);
  }

  equals(other: RestaurantSlug): boolean {
    return this.value === other.value;
  }
}
