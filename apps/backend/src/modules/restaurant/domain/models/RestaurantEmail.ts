const MAX_LENGTH = 255;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class RestaurantEmail {
  private constructor(public readonly value: string) {}

  static create(value: string): RestaurantEmail {
    const trimmed = value.trim().toLowerCase();

    if (trimmed.length === 0) {
      throw new Error("Restaurant email cannot be empty");
    }

    if (trimmed.length > MAX_LENGTH) {
      throw new Error(`Restaurant email cannot exceed ${MAX_LENGTH} characters`);
    }

    if (!EMAIL_PATTERN.test(trimmed)) {
      throw new Error("Restaurant email must be a valid email address");
    }

    return new RestaurantEmail(trimmed);
  }

  static reconstitute(value: string): RestaurantEmail {
    return new RestaurantEmail(value.toLowerCase());
  }

  equals(other: RestaurantEmail): boolean {
    return this.value === other.value;
  }
}
