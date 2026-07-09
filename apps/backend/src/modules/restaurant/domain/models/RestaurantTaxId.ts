const MAX_LENGTH = 50;
const MIN_LENGTH = 3;

export class RestaurantTaxId {
  private constructor(public readonly value: string) {}

  static create(value: string): RestaurantTaxId {
    const trimmed = value.trim().toUpperCase();

    if (trimmed.length < MIN_LENGTH) {
      throw new Error(`Restaurant tax ID must be at least ${MIN_LENGTH} characters`);
    }

    if (trimmed.length > MAX_LENGTH) {
      throw new Error(`Restaurant tax ID cannot exceed ${MAX_LENGTH} characters`);
    }

    return new RestaurantTaxId(trimmed);
  }

  static reconstitute(value: string): RestaurantTaxId {
    return new RestaurantTaxId(value.toUpperCase());
  }

  equals(other: RestaurantTaxId): boolean {
    return this.value === other.value;
  }
}
