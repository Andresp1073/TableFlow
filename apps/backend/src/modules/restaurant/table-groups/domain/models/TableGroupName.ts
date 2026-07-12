const MIN_LENGTH = 1;
const MAX_LENGTH = 100;

export class TableGroupName {
  private constructor(public readonly value: string) {}

  static create(value: string): TableGroupName {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
      throw new Error(
        `Table group name must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`,
      );
    }
    return new TableGroupName(trimmed);
  }

  static reconstitute(value: string): TableGroupName {
    return new TableGroupName(value);
  }

  equals(other: TableGroupName): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
