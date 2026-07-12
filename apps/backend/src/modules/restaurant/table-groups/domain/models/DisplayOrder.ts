export class DisplayOrder {
  private constructor(public readonly value: number) {}

  static create(value: number): DisplayOrder {
    if (!Number.isInteger(value)) {
      throw new Error("Display order must be an integer");
    }
    if (value < 0) {
      throw new Error("Display order must not be negative");
    }
    if (value > 9999) {
      throw new Error("Display order must not exceed 9999");
    }
    return new DisplayOrder(value);
  }

  static reconstitute(value: number): DisplayOrder {
    return new DisplayOrder(value);
  }

  equals(other: DisplayOrder): boolean {
    return this.value === other.value;
  }
}
