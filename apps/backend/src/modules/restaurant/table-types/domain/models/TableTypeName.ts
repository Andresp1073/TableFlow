export class TableTypeName {
  private constructor(public readonly value: string) {}

  static create(value: string): TableTypeName {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("Table type name must not be empty");
    }
    if (trimmed.length > 100) {
      throw new Error("Table type name must not exceed 100 characters");
    }
    return new TableTypeName(trimmed);
  }

  static reconstitute(value: string): TableTypeName {
    return new TableTypeName(value);
  }

  equals(other: TableTypeName): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
