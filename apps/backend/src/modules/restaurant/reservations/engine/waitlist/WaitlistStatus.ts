const VALID_STATUSES = ["waiting", "eligible", "promoted", "expired", "cancelled"] as const;

export type WaitlistStatusValue = (typeof VALID_STATUSES)[number];

const ACTIVE_STATUSES: WaitlistStatusValue[] = ["waiting", "eligible"];

const TRANSITION_MATRIX: Record<string, WaitlistStatusValue[]> = {
  waiting: ["eligible", "expired", "cancelled"],
  eligible: ["promoted", "expired", "cancelled"],
  promoted: [],
  expired: [],
  cancelled: [],
};

export class WaitlistStatus {
  private constructor(public readonly value: WaitlistStatusValue) {}

  static create(value: string): WaitlistStatus {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
    if (!VALID_STATUSES.includes(normalized as WaitlistStatusValue)) {
      throw new Error(
        `Invalid waitlist status "${value}". Allowed: ${VALID_STATUSES.join(", ")}`,
      );
    }
    return new WaitlistStatus(normalized as WaitlistStatusValue);
  }

  static reconstitute(value: string): WaitlistStatus {
    return new WaitlistStatus(value as WaitlistStatusValue);
  }

  equals(other: WaitlistStatus): boolean {
    return this.value === other.value;
  }

  isTransitionValid(target: WaitlistStatusValue): boolean {
    const allowed = TRANSITION_MATRIX[this.value] ?? [];
    return allowed.includes(target);
  }

  getAllowedTransitions(): WaitlistStatusValue[] {
    return [...(TRANSITION_MATRIX[this.value] ?? [])];
  }

  isActive(): boolean {
    return ACTIVE_STATUSES.includes(this.value);
  }

  isTerminal(): boolean {
    return ["promoted", "expired", "cancelled"].includes(this.value);
  }

  isWaiting(): boolean {
    return this.value === "waiting";
  }

  isEligible(): boolean {
    return this.value === "eligible";
  }

  isPromoted(): boolean {
    return this.value === "promoted";
  }

  isExpired(): boolean {
    return this.value === "expired";
  }

  isCancelled(): boolean {
    return this.value === "cancelled";
  }

  static readonly WAITING = "waiting" as const;
  static readonly ELIGIBLE = "eligible" as const;
  static readonly PROMOTED = "promoted" as const;
  static readonly EXPIRED = "expired" as const;
  static readonly CANCELLED = "cancelled" as const;
}
