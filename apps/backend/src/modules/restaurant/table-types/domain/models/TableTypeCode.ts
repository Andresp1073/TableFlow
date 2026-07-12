const CODE_REGEX = /^[A-Z0-9][A-Z0-9_-]{0,28}[A-Z0-9]$|^[A-Z0-9]$/;

export class TableTypeCode {
  private constructor(public readonly value: string) {}

  static create(value: string): TableTypeCode {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) {
      throw new Error("Table type code must not be empty");
    }
    if (trimmed.length > 30) {
      throw new Error("Table type code must not exceed 30 characters");
    }
    if (!CODE_REGEX.test(trimmed)) {
      throw new Error(
        "Table type code must start and end with an alphanumeric character and contain only uppercase letters, numbers, underscores, and hyphens",
      );
    }
    return new TableTypeCode(trimmed);
  }

  static reconstitute(value: string): TableTypeCode {
    return new TableTypeCode(value);
  }

  equals(other: TableTypeCode): boolean {
    return this.value === other.value;
  }
}
