export enum CustomerTier {
  Bronze = "bronze",
  Silver = "silver",
  Gold = "gold",
  Platinum = "platinum",
  Custom = "custom",
}

export type CustomerPreferences = {
  favoriteCuisines?: string[];
  dietaryRestrictions?: string[];
  seatingPreferences?: string[];
  communicationChannels?: ("email" | "sms" | "push")[];
  specialOccasions?: Array<{ type: string; date: string }>;
  marketingOptIn: boolean;
};

export interface CustomerProfileConfig {
  id: string;
  restaurantId: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  anniversaryDate?: string;
  tier: CustomerTier;
  totalSpent: number;
  totalVisits: number;
  firstVisitAt: Date | null;
  lastVisitAt: Date | null;
  preferences: CustomerPreferences;
  tags: string[];
  notes: string;
  isActive: boolean;
  enrolledAt: Date;
  updatedAt: Date;
}

export class CustomerProfile {
  private constructor(public readonly value: CustomerProfileConfig) {}

  static create(config: Omit<CustomerProfileConfig, "tier" | "totalSpent" | "totalVisits" | "firstVisitAt" | "lastVisitAt" | "enrolledAt" | "updatedAt" | "tags" | "notes" | "isActive">): CustomerProfile {
    const now = new Date();
    return new CustomerProfile({
      ...config,
      tier: CustomerTier.Bronze,
      totalSpent: 0,
      totalVisits: 0,
      firstVisitAt: null,
      lastVisitAt: null,
      tags: [],
      notes: "",
      isActive: true,
      enrolledAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(config: CustomerProfileConfig): CustomerProfile {
    return new CustomerProfile(config);
  }

  get id(): string { return this.value.id; }
  get restaurantId(): string { return this.value.restaurantId; }
  get customerId(): string { return this.value.customerId; }
  get firstName(): string { return this.value.firstName; }
  get lastName(): string { return this.value.lastName; }
  get email(): string { return this.value.email; }
  get phone(): string | undefined { return this.value.phone; }
  get dateOfBirth(): string | undefined { return this.value.dateOfBirth; }
  get anniversaryDate(): string | undefined { return this.value.anniversaryDate; }
  get tier(): CustomerTier { return this.value.tier; }
  get totalSpent(): number { return this.value.totalSpent; }
  get totalVisits(): number { return this.value.totalVisits; }
  get firstVisitAt(): Date | null { return this.value.firstVisitAt; }
  get lastVisitAt(): Date | null { return this.value.lastVisitAt; }
  get preferences(): CustomerPreferences { return this.value.preferences; }
  get tags(): readonly string[] { return this.value.tags; }
  get notes(): string { return this.value.notes; }
  get isActive(): boolean { return this.value.isActive; }
  get enrolledAt(): Date { return this.value.enrolledAt; }
  get updatedAt(): Date { return this.value.updatedAt; }

  equals(other: CustomerProfile): boolean { return this.value.id === other.value.id; }
  get fullName(): string { return `${this.value.firstName} ${this.value.lastName}`; }

  updateTier(tier: CustomerTier): CustomerProfile {
    return CustomerProfile.reconstitute({ ...this.value, tier, updatedAt: new Date() });
  }

  recordVisit(spent: number): CustomerProfile {
    const now = new Date();
    return CustomerProfile.reconstitute({
      ...this.value,
      totalVisits: this.value.totalVisits + 1,
      totalSpent: this.value.totalSpent + spent,
      firstVisitAt: this.value.firstVisitAt ?? now,
      lastVisitAt: now,
      updatedAt: now,
    });
  }

  updatePreferences(prefs: Partial<CustomerPreferences>): CustomerProfile {
    return CustomerProfile.reconstitute({
      ...this.value,
      preferences: { ...this.value.preferences, ...prefs },
      updatedAt: new Date(),
    });
  }

  addTag(tag: string): CustomerProfile {
    if (this.value.tags.includes(tag)) return this;
    return CustomerProfile.reconstitute({
      ...this.value, tags: [...this.value.tags, tag], updatedAt: new Date(),
    });
  }

  deactivate(): CustomerProfile {
    return CustomerProfile.reconstitute({ ...this.value, isActive: false, updatedAt: new Date() });
  }

  activate(): CustomerProfile {
    return CustomerProfile.reconstitute({ ...this.value, isActive: true, updatedAt: new Date() });
  }
}
