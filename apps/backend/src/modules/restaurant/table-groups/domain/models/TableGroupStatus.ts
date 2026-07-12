const VALID_STATUSES = ["active", "reserved", "occupied", "released", "archived"] as const;

export type TableGroupStatusValue = (typeof VALID_STATUSES)[number];

const TRANSITION_MATRIX: Record<string, TableGroupStatusValue[]> = {
  active: ["reserved", "occupied", "released", "archived"],
  reserved: ["occupied", "active", "released"],
  occupied: ["released"],
  released: ["archived"],
  archived: [],
};

export class TableGroupStatus {
  private constructor(public readonly value: TableGroupStatusValue) {}

  static create(value: string): TableGroupStatus {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
    if (!VALID_STATUSES.includes(normalized as TableGroupStatusValue)) {
      throw new Error(
        `Invalid table group status "${value}". Allowed: ${VALID_STATUSES.join(", ")}`,
      );
    }
    return new TableGroupStatus(normalized as TableGroupStatusValue);
  }

  static reconstitute(value: string): TableGroupStatus {
    return new TableGroupStatus(value as TableGroupStatusValue);
  }

  equals(other: TableGroupStatus): boolean {
    return this.value === other.value;
  }

  isTransitionValid(target: TableGroupStatusValue): boolean {
    const allowed = TRANSITION_MATRIX[this.value] ?? [];
    return allowed.includes(target);
  }

  getAllowedTransitions(): TableGroupStatusValue[] {
    return [...(TRANSITION_MATRIX[this.value] ?? [])];
  }

  isTerminal(): boolean {
    return this.value === "archived" || this.value === "released";
  }

  isActive(): boolean {
    return this.value === "active";
  }

  isReleased(): boolean {
    return this.value === "released";
  }

  isArchived(): boolean {
    return this.value === "archived";
  }

  isReserved(): boolean {
    return this.value === "reserved";
  }

  isOccupied(): boolean {
    return this.value === "occupied";
  }

  static readonly ACTIVE = "active" as const;
  static readonly RESERVED = "reserved" as const;
  static readonly OCCUPIED = "occupied" as const;
  static readonly RELEASED = "released" as const;
  static readonly ARCHIVED = "archived" as const;
}
