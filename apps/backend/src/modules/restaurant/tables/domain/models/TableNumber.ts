const TABLE_NUMBER_REGEX = /^[A-Z0-9][A-Z0-9_-]{0,8}[A-Z0-9]$|^[A-Z0-9]$/;

export class TableNumber {
  private constructor(public readonly value: string) {}

  static create(value: string): TableNumber {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) {
      throw new Error("Table number must not be empty");
    }
    if (trimmed.length > 10) {
      throw new Error("Table number must not exceed 10 characters");
    }
    if (!TABLE_NUMBER_REGEX.test(trimmed)) {
      throw new Error(
        "Table number must start and end with an alphanumeric character and contain only uppercase letters, numbers, underscores, and hyphens",
      );
    }
    return new TableNumber(trimmed);
  }

  static reconstitute(value: string): TableNumber {
    return new TableNumber(value);
  }

  equals(other: TableNumber): boolean {
    return this.value === other.value;
  }
}
