const VALID_STATUSES = ["active", "archived"] as const;

export type TableTypeStatusValue = (typeof VALID_STATUSES)[number];

export class TableTypeStatus {
  private constructor(public readonly value: TableTypeStatusValue) {}

  static create(value: string): TableTypeStatus {
    const normalized = value.trim().toLowerCase();
    if (!VALID_STATUSES.includes(normalized as TableTypeStatusValue)) {
      throw new Error(
        `Invalid table type status "${value}". Allowed: ${VALID_STATUSES.join(", ")}`,
      );
    }
    return new TableTypeStatus(normalized as TableTypeStatusValue);
  }

  static reconstitute(value: string): TableTypeStatus {
    return new TableTypeStatus(value as TableTypeStatusValue);
  }

  equals(other: TableTypeStatus): boolean {
    return this.value === other.value;
  }

  canTransitionTo(next: TableTypeStatus): boolean {
    if (this.value === "active" && next.value === "archived") return true;
    return false;
  }

  isActive(): boolean {
    return this.value === "active";
  }

  isArchived(): boolean {
    return this.value === "archived";
  }

  static readonly ACTIVE = "active" as const;
  static readonly ARCHIVED = "archived" as const;
}
