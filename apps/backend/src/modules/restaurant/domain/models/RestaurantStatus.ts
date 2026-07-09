export const RESTAURANT_STATUSES = [
  "draft",
  "pending",
  "active",
  "suspended",
  "inactive",
  "archived",
] as const;

export type RestaurantStatusValue = typeof RESTAURANT_STATUSES[number];

const TRANSITIONS: Record<RestaurantStatusValue, RestaurantStatusValue[]> = {
  draft: ["pending", "archived"],
  pending: ["active", "draft"],
  active: ["suspended", "inactive"],
  suspended: ["active", "inactive"],
  inactive: ["active", "archived"],
  archived: [],
};

export class RestaurantStatus {
  private constructor(public readonly value: RestaurantStatusValue) {}

  static create(value: string): RestaurantStatus {
    const normalized = value.trim().toLowerCase() as RestaurantStatusValue;

    if (!RESTAURANT_STATUSES.includes(normalized)) {
      throw new Error(
        `Invalid restaurant status "${value}". Allowed values: ${RESTAURANT_STATUSES.join(", ")}`
      );
    }

    return new RestaurantStatus(normalized);
  }

  static reconstitute(value: string): RestaurantStatus {
    return new RestaurantStatus(value as RestaurantStatusValue);
  }

  static draft(): RestaurantStatus {
    return new RestaurantStatus("draft");
  }

  static pending(): RestaurantStatus {
    return new RestaurantStatus("pending");
  }

  static active(): RestaurantStatus {
    return new RestaurantStatus("active");
  }

  static suspended(): RestaurantStatus {
    return new RestaurantStatus("suspended");
  }

  static inactive(): RestaurantStatus {
    return new RestaurantStatus("inactive");
  }

  static archived(): RestaurantStatus {
    return new RestaurantStatus("archived");
  }

  isDraft(): boolean {
    return this.value === "draft";
  }

  isPending(): boolean {
    return this.value === "pending";
  }

  isActive(): boolean {
    return this.value === "active";
  }

  isSuspended(): boolean {
    return this.value === "suspended";
  }

  isInactive(): boolean {
    return this.value === "inactive";
  }

  isArchived(): boolean {
    return this.value === "archived";
  }

  isTerminal(): boolean {
    return this.value === "archived";
  }

  canTransitionTo(target: RestaurantStatusValue): boolean {
    return TRANSITIONS[this.value].includes(target);
  }

  allowedTransitions(): readonly RestaurantStatusValue[] {
    return TRANSITIONS[this.value];
  }

  equals(other: RestaurantStatus): boolean {
    return this.value === other.value;
  }
}
