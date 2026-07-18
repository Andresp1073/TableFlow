const VALID_STATUSES = [
  "available",
  "occupied",
  "reserved",
  "cleaning",
  "out_of_service",
  "blocked",
  "maintenance",
  "archived",
] as const;

export type TableStatusValue = (typeof VALID_STATUSES)[number];

const TRANSITION_MATRIX: Record<string, string[]> = {
  available: ["reserved", "occupied", "blocked", "maintenance", "cleaning"],
  reserved: ["occupied", "available", "blocked"],
  occupied: ["cleaning", "blocked"],
  cleaning: ["available"],
  maintenance: ["available"],
  blocked: ["available"],
  out_of_service: ["available", "maintenance"],
  archived: [],
};

export class TableStatus {
  private constructor(public readonly value: TableStatusValue) {}

  static create(value: string): TableStatus {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
    if (!VALID_STATUSES.includes(normalized as TableStatusValue)) {
      throw new Error(
        `Invalid table status "${value}". Allowed: ${VALID_STATUSES.join(", ")}`,
      );
    }
    return new TableStatus(normalized as TableStatusValue);
  }

  static reconstitute(value: string): TableStatus {
    return new TableStatus(value as TableStatusValue);
  }

  equals(other: TableStatus): boolean {
    return this.value === other.value;
  }

  isTransitionValid(target: TableStatusValue): boolean {
    const allowed = TRANSITION_MATRIX[this.value] ?? [];
    return allowed.includes(target);
  }

  getAllowedTransitions(): TableStatusValue[] {
    return [...(TRANSITION_MATRIX[this.value] ?? [])] as TableStatusValue[];
  }

  isTerminal(): boolean {
    return this.value === "archived";
  }

  isAvailable(): boolean {
    return this.value === "available";
  }

  isOccupied(): boolean {
    return this.value === "occupied";
  }

  isReserved(): boolean {
    return this.value === "reserved";
  }

  isServiceable(): boolean {
    return (this.value as string) !== "archived" && (this.value as string) !== "deleted";
  }

  static readonly TRANSITION_MATRIX = TRANSITION_MATRIX;

  static readonly AVAILABLE = "available" as const;
  static readonly OCCUPIED = "occupied" as const;
  static readonly RESERVED = "reserved" as const;
  static readonly CLEANING = "cleaning" as const;
  static readonly OUT_OF_SERVICE = "out_of_service" as const;
  static readonly BLOCKED = "blocked" as const;
  static readonly MAINTENANCE = "maintenance" as const;
  static readonly ARCHIVED = "archived" as const;
}
