export class TableCapacity {
  private constructor(public readonly value: number) {}

  static create(value: number): TableCapacity {
    if (!Number.isInteger(value)) {
      throw new Error("Capacity must be an integer");
    }
    if (value < 0) {
      throw new Error("Capacity must not be negative");
    }
    if (value > 999) {
      throw new Error("Capacity must not exceed 999");
    }
    return new TableCapacity(value);
  }

  static reconstitute(value: number): TableCapacity {
    return new TableCapacity(value);
  }

  equals(other: TableCapacity): boolean {
    return this.value === other.value;
  }
}
