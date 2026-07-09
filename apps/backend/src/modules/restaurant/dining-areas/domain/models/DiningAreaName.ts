export class DiningAreaName {
  private constructor(public readonly value: string) {}

  static create(value: string): DiningAreaName {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("Dining area name must not be empty");
    }
    if (trimmed.length > 100) {
      throw new Error("Dining area name must not exceed 100 characters");
    }
    return new DiningAreaName(trimmed);
  }

  static reconstitute(value: string): DiningAreaName {
    return new DiningAreaName(value);
  }

  equals(other: DiningAreaName): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
