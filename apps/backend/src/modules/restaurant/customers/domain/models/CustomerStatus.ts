const VALID_STATUSES = ["active", "inactive", "blocked", "archived"] as const;

export type CustomerStatusValue = (typeof VALID_STATUSES)[number];

const TRANSITION_MATRIX: Record<string, CustomerStatusValue[]> = {
  active: ["inactive", "blocked", "archived"],
  inactive: ["active", "archived"],
  blocked: ["active", "archived"],
  archived: [],
};

export class CustomerStatus {
  private constructor(public readonly value: CustomerStatusValue) {}

  static create(value: string): CustomerStatus {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
    if (!VALID_STATUSES.includes(normalized as CustomerStatusValue)) {
      throw new Error(
        `Invalid customer status "${value}". Allowed: ${VALID_STATUSES.join(", ")}`,
      );
    }
    return new CustomerStatus(normalized as CustomerStatusValue);
  }

  static reconstitute(value: string): CustomerStatus {
    return new CustomerStatus(value as CustomerStatusValue);
  }

  equals(other: CustomerStatus): boolean {
    return this.value === other.value;
  }

  isTransitionValid(target: CustomerStatusValue): boolean {
    const allowed = TRANSITION_MATRIX[this.value] ?? [];
    return allowed.includes(target);
  }

  getAllowedTransitions(): CustomerStatusValue[] {
    return [...(TRANSITION_MATRIX[this.value] ?? [])];
  }

  isActive(): boolean {
    return this.value === "active";
  }

  isInactive(): boolean {
    return this.value === "inactive";
  }

  isBlocked(): boolean {
    return this.value === "blocked";
  }

  isArchived(): boolean {
    return this.value === "archived";
  }

  isTerminal(): boolean {
    return this.value === "archived";
  }

  canMakeReservations(): boolean {
    return this.value === "active";
  }

  static readonly ACTIVE = "active" as const;
  static readonly INACTIVE = "inactive" as const;
  static readonly BLOCKED = "blocked" as const;
  static readonly ARCHIVED = "archived" as const;
}
