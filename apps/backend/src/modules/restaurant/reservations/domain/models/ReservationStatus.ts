const VALID_STATUSES = [
  "pending",
  "confirmed",
  "checked_in",
  "seated",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type ReservationStatusValue = (typeof VALID_STATUSES)[number];

const TRANSITION_MATRIX: Record<string, ReservationStatusValue[]> = {
  pending: ["confirmed", "cancelled", "no_show"],
  confirmed: ["checked_in", "cancelled", "no_show", "completed"],
  checked_in: ["seated", "cancelled"],
  seated: ["completed", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

const ACTIVE_STATUSES: ReservationStatusValue[] = [
  "pending",
  "confirmed",
  "checked_in",
  "seated",
];

export class ReservationStatus {
  private constructor(public readonly value: ReservationStatusValue) {}

  static create(value: string): ReservationStatus {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
    if (!VALID_STATUSES.includes(normalized as ReservationStatusValue)) {
      throw new Error(
        `Invalid reservation status "${value}". Allowed: ${VALID_STATUSES.join(", ")}`,
      );
    }
    return new ReservationStatus(normalized as ReservationStatusValue);
  }

  static reconstitute(value: string): ReservationStatus {
    return new ReservationStatus(value as ReservationStatusValue);
  }

  equals(other: ReservationStatus): boolean {
    return this.value === other.value;
  }

  isTransitionValid(target: ReservationStatusValue): boolean {
    const allowed = TRANSITION_MATRIX[this.value] ?? [];
    return allowed.includes(target);
  }

  getAllowedTransitions(): ReservationStatusValue[] {
    return [...(TRANSITION_MATRIX[this.value] ?? [])];
  }

  isActive(): boolean {
    return ACTIVE_STATUSES.includes(this.value);
  }

  isTerminal(): boolean {
    return ["completed", "cancelled", "no_show"].includes(this.value);
  }

  isPending(): boolean {
    return this.value === "pending";
  }

  isConfirmed(): boolean {
    return this.value === "confirmed";
  }

  isCheckedIn(): boolean {
    return this.value === "checked_in";
  }

  isSeated(): boolean {
    return this.value === "seated";
  }

  isCompleted(): boolean {
    return this.value === "completed";
  }

  isCancelled(): boolean {
    return this.value === "cancelled";
  }

  isNoShow(): boolean {
    return this.value === "no_show";
  }

  static readonly PENDING = "pending" as const;
  static readonly CONFIRMED = "confirmed" as const;
  static readonly CHECKED_IN = "checked_in" as const;
  static readonly SEATED = "seated" as const;
  static readonly COMPLETED = "completed" as const;
  static readonly CANCELLED = "cancelled" as const;
  static readonly NO_SHOW = "no_show" as const;
}
