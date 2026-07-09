const MAX_LENGTH = 20;
const MIN_LENGTH = 6;
const DIGITS_ONLY = /^\d+$/;

export class RestaurantPhone {
  private constructor(public readonly value: string) {}

  static create(value: string): RestaurantPhone {
    const trimmed = value.trim();

    if (trimmed.length < MIN_LENGTH) {
      throw new Error(`Restaurant phone must be at least ${MIN_LENGTH} characters`);
    }

    if (trimmed.length > MAX_LENGTH) {
      throw new Error(`Restaurant phone cannot exceed ${MAX_LENGTH} characters`);
    }

    const digits = trimmed.replace(/\D/g, "");

    if (digits.length < MIN_LENGTH) {
      throw new Error("Restaurant phone must contain at least 6 digits");
    }

    return new RestaurantPhone(trimmed);
  }

  static reconstitute(value: string): RestaurantPhone {
    return new RestaurantPhone(value);
  }

  getDigits(): string {
    return this.value.replace(/\D/g, "");
  }

  equals(other: RestaurantPhone): boolean {
    return this.value === other.value;
  }
}
