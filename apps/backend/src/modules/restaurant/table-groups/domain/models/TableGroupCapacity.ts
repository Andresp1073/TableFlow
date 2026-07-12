/** @deprecated Capacity is now computed at runtime by GroupCapacityCalculator.
 *  This class is retained only for backward compatibility with the application layer. */
export class TableGroupCapacity {
  private constructor(public readonly value: number) {}

  static create(value: number): TableGroupCapacity {
    if (!Number.isInteger(value)) {
      throw new Error("TableGroupCapacity must be an integer");
    }
    if (value < 0) {
      throw new Error("TableGroupCapacity must not be negative");
    }
    if (value > 999) {
      throw new Error("TableGroupCapacity must not exceed 999");
    }
    return new TableGroupCapacity(value);
  }

  static reconstitute(value: number): TableGroupCapacity {
    return new TableGroupCapacity(value);
  }

  equals(other: TableGroupCapacity): boolean {
    return this.value === other.value;
  }
}
