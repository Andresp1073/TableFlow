const VALID_STATUSES = ["active", "archived"] as const;

export type DiningAreaStatusValue = (typeof VALID_STATUSES)[number];

export class DiningAreaStatus {
  private constructor(public readonly value: DiningAreaStatusValue) {}

  static create(value: string): DiningAreaStatus {
    const normalized = value.trim().toLowerCase();
    if (!VALID_STATUSES.includes(normalized as DiningAreaStatusValue)) {
      throw new Error(
        `Invalid dining area status "${value}". Allowed: ${VALID_STATUSES.join(", ")}`,
      );
    }
    return new DiningAreaStatus(normalized as DiningAreaStatusValue);
  }

  static reconstitute(value: string): DiningAreaStatus {
    return new DiningAreaStatus(value as DiningAreaStatusValue);
  }

  equals(other: DiningAreaStatus): boolean {
    return this.value === other.value;
  }

  canTransitionTo(next: DiningAreaStatus): boolean {
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
