export enum VisitFrequency {
  VeryLow = "very_low",
  Low = "low",
  Medium = "medium",
  High = "high",
  VeryHigh = "very_high",
}

export enum SpendingLevel {
  VeryLow = "very_low",
  Low = "low",
  Medium = "medium",
  High = "high",
  VeryHigh = "very_high",
}

export enum EngagementLevel {
  Inactive = "inactive",
  Low = "low",
  Medium = "medium",
  High = "high",
  VeryHigh = "very_high",
}

export interface SegmentCriteria {
  visitFrequency?: VisitFrequency;
  spendingLevel?: SpendingLevel;
  minTotalSpent?: number;
  maxTotalSpent?: number;
  minTotalVisits?: number;
  maxTotalVisits?: number;
  engagementLevel?: EngagementLevel;
  preferredCuisines?: string[];
  tags?: string[];
  minDaysSinceLastVisit?: number;
  maxDaysSinceLastVisit?: number;
  isBirthdayMonth?: boolean;
  isAnniversaryMonth?: boolean;
}

export interface CustomerSegmentConfig {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerSegment {
  private constructor(public readonly value: CustomerSegmentConfig) {}

  static create(config: Omit<CustomerSegmentConfig, "isActive" | "createdAt" | "updatedAt">): CustomerSegment {
    const now = new Date();
    return new CustomerSegment({
      ...config,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(config: CustomerSegmentConfig): CustomerSegment {
    return new CustomerSegment(config);
  }

  get id(): string { return this.value.id; }
  get restaurantId(): string { return this.value.restaurantId; }
  get name(): string { return this.value.name; }
  get description(): string { return this.value.description; }
  get criteria(): SegmentCriteria { return this.value.criteria; }
  get isActive(): boolean { return this.value.isActive; }
  get createdAt(): Date { return this.value.createdAt; }
  get updatedAt(): Date { return this.value.updatedAt; }

  equals(other: CustomerSegment): boolean { return this.value.id === other.value.id; }

  updateCriteria(criteria: SegmentCriteria): CustomerSegment {
    return CustomerSegment.reconstitute({ ...this.value, criteria, updatedAt: new Date() });
  }

  activate(): CustomerSegment {
    return CustomerSegment.reconstitute({ ...this.value, isActive: true, updatedAt: new Date() });
  }

  deactivate(): CustomerSegment {
    return CustomerSegment.reconstitute({ ...this.value, isActive: false, updatedAt: new Date() });
  }
}
