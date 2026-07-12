export class TableName {
  private constructor(public readonly value: string) {}

  static create(value: string): TableName {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("Table name must not be empty");
    }
    if (trimmed.length > 100) {
      throw new Error("Table name must not exceed 100 characters");
    }
    return new TableName(trimmed);
  }

  static reconstitute(value: string): TableName {
    return new TableName(value);
  }

  equals(other: TableName): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
