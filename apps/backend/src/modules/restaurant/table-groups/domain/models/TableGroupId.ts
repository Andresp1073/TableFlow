const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class TableGroupId {
  private constructor(public readonly value: string) {}

  static create(value: string): TableGroupId {
    if (!value || !UUID_REGEX.test(value)) {
      throw new Error(`TableGroupId must be a valid UUID, got "${value}"`);
    }
    return new TableGroupId(value);
  }

  static reconstitute(value: string): TableGroupId {
    return new TableGroupId(value);
  }

  equals(other: TableGroupId): boolean {
    return this.value === other.value;
  }
}
