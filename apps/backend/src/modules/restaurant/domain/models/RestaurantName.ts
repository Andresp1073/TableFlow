const MAX_LENGTH = 255;
const MIN_LENGTH = 1;

export class RestaurantName {
  private constructor(public readonly value: string) {}

  static create(value: string): RestaurantName {
    const trimmed = value.trim();

    if (trimmed.length < MIN_LENGTH) {
      throw new Error("Restaurant name cannot be empty");
    }

    if (trimmed.length > MAX_LENGTH) {
      throw new Error(`Restaurant name cannot exceed ${MAX_LENGTH} characters`);
    }

    return new RestaurantName(trimmed);
  }

  static reconstitute(value: string): RestaurantName {
    return new RestaurantName(value);
  }

  equals(other: RestaurantName): boolean {
    return this.value === other.value;
  }
}
