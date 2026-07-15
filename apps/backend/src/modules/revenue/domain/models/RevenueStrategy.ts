export enum RevenueStrategyType {
  DynamicPricing = "dynamic_pricing",
  TimeBasedPricing = "time_based_pricing",
  PeakPricing = "peak_pricing",
  OffPeakIncentive = "off_peak_incentive",
  MinimumSpend = "minimum_spend",
  SpecialEventPricing = "special_event_pricing",
  EarlyBird = "early_bird",
  LastMinute = "last_minute",
}

export enum StrategyStatus {
  Draft = "draft",
  Active = "active",
  Paused = "paused",
  Expired = "expired",
}

export interface StrategyCondition {
  dayOfWeek?: number[];
  timeSlot?: string[];
  minOccupancy?: number;
  maxOccupancy?: number;
  minPartySize?: number;
  maxPartySize?: number;
  isHoliday?: boolean;
  specialEvent?: string;
  leadTimeHours?: { min?: number; max?: number };
}

export interface RevenueStrategyConfig {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  type: RevenueStrategyType;
  status: StrategyStatus;
  conditions: StrategyCondition;
  priceMultiplier: number;
  priceDiscount: number;
  minimumSpend: number | null;
  priority: number;
  diningAreaIds: string[];
  validFrom: Date;
  validTo: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class RevenueStrategy {
  private constructor(public readonly data: RevenueStrategyConfig) {}

  static create(config: Omit<RevenueStrategyConfig, "status" | "isActive" | "createdAt" | "updatedAt">): RevenueStrategy {
    const now = new Date();
    return new RevenueStrategy({
      ...config, status: StrategyStatus.Draft, isActive: true, createdAt: now, updatedAt: now,
    });
  }

  static reconstitute(config: RevenueStrategyConfig): RevenueStrategy {
    return new RevenueStrategy(config);
  }

  get id(): string { return this.data.id; }
  get restaurantId(): string { return this.data.restaurantId; }
  get name(): string { return this.data.name; }
  get description(): string { return this.data.description; }
  get type(): RevenueStrategyType { return this.data.type; }
  get status(): StrategyStatus { return this.data.status; }
  get conditions(): StrategyCondition { return this.data.conditions; }
  get priceMultiplier(): number { return this.data.priceMultiplier; }
  get priceDiscount(): number { return this.data.priceDiscount; }
  get minimumSpend(): number | null { return this.data.minimumSpend; }
  get priority(): number { return this.data.priority; }
  get diningAreaIds(): readonly string[] { return this.data.diningAreaIds; }
  get validFrom(): Date { return this.data.validFrom; }
  get validTo(): Date | null { return this.data.validTo; }
  get isActive(): boolean { return this.data.isActive; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  equals(other: RevenueStrategy): boolean { return this.data.id === other.data.id; }

  isCurrentlyValid(): boolean {
    if (!this.data.isActive) return false;
    if (this.data.status !== StrategyStatus.Active) return false;
    const now = new Date();
    if (now < this.data.validFrom) return false;
    if (this.data.validTo && now > this.data.validTo) return false;
    return true;
  }

  matchesDate(date: Date): boolean {
    if (this.data.conditions.dayOfWeek && this.data.conditions.dayOfWeek.length > 0) {
      if (!this.data.conditions.dayOfWeek.includes(date.getDay())) return false;
    }
    return true;
  }

  activate(): RevenueStrategy {
    return RevenueStrategy.reconstitute({
      ...this.data, status: StrategyStatus.Active, isActive: true, updatedAt: new Date(),
    });
  }

  pause(): RevenueStrategy {
    return RevenueStrategy.reconstitute({ ...this.data, status: StrategyStatus.Paused, updatedAt: new Date() });
  }

  expire(): RevenueStrategy {
    return RevenueStrategy.reconstitute({ ...this.data, status: StrategyStatus.Expired, isActive: false, updatedAt: new Date() });
  }

  getEffectivePrice(basePrice: number): number {
    let price = basePrice * this.data.priceMultiplier;
    if (this.data.priceDiscount > 0) {
      price = price - this.data.priceDiscount;
    }
    if (this.data.minimumSpend !== null && price < this.data.minimumSpend) {
      price = this.data.minimumSpend;
    }
    return Math.round(price * 100) / 100;
  }
}
