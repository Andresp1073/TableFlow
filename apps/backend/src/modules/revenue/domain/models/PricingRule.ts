import type { StrategyCondition } from "./RevenueStrategy.js";

export interface PricingRuleConfig {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  conditions: StrategyCondition;
  priceMultiplier: number;
  priceDiscount: number;
  minimumSpend: number | null;
  priority: number;
  diningAreaIds: string[];
  validFrom: Date;
  validTo: Date | null;
  maxApplicationsPerDay: number | null;
  applicationCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PricingRule {
  private constructor(public readonly data: PricingRuleConfig) {}

  static create(config: Omit<PricingRuleConfig, "applicationCount" | "isActive" | "createdAt" | "updatedAt">): PricingRule {
    const now = new Date();
    return new PricingRule({
      ...config, applicationCount: 0, isActive: true, createdAt: now, updatedAt: now,
    });
  }

  static reconstitute(config: PricingRuleConfig): PricingRule {
    return new PricingRule(config);
  }

  get id(): string { return this.data.id; }
  get restaurantId(): string { return this.data.restaurantId; }
  get name(): string { return this.data.name; }
  get description(): string { return this.data.description; }
  get conditions(): StrategyCondition { return this.data.conditions; }
  get priceMultiplier(): number { return this.data.priceMultiplier; }
  get priceDiscount(): number { return this.data.priceDiscount; }
  get minimumSpend(): number | null { return this.data.minimumSpend; }
  get priority(): number { return this.data.priority; }
  get diningAreaIds(): readonly string[] { return this.data.diningAreaIds; }
  get validFrom(): Date { return this.data.validFrom; }
  get validTo(): Date | null { return this.data.validTo; }
  get maxApplicationsPerDay(): number | null { return this.data.maxApplicationsPerDay; }
  get applicationCount(): number { return this.data.applicationCount; }
  get isActive(): boolean { return this.data.isActive; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  equals(other: PricingRule): boolean { return this.data.id === other.data.id; }

  isApplicable(occupancyRate: number, partySize: number, dayOfWeek: number, timeSlot: string): boolean {
    if (!this.data.isActive) return false;
    const now = new Date();
    if (now < this.data.validFrom) return false;
    if (this.data.validTo && now > this.data.validTo) return false;

    if (this.data.maxApplicationsPerDay !== null && this.data.applicationCount >= this.data.maxApplicationsPerDay) return false;

    const c = this.data.conditions;
    if (c.minOccupancy !== undefined && occupancyRate < c.minOccupancy) return false;
    if (c.maxOccupancy !== undefined && occupancyRate > c.maxOccupancy) return false;
    if (c.minPartySize !== undefined && partySize < c.minPartySize) return false;
    if (c.maxPartySize !== undefined && partySize > c.maxPartySize) return false;
    if (c.dayOfWeek && c.dayOfWeek.length > 0 && !c.dayOfWeek.includes(dayOfWeek)) return false;
    if (c.timeSlot && c.timeSlot.length > 0 && !c.timeSlot.includes(timeSlot)) return false;

    return true;
  }

  recordApplication(): PricingRule {
    return PricingRule.reconstitute({ ...this.data, applicationCount: this.data.applicationCount + 1, updatedAt: new Date() });
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

  activate(): PricingRule {
    return PricingRule.reconstitute({ ...this.data, isActive: true, updatedAt: new Date() });
  }

  deactivate(): PricingRule {
    return PricingRule.reconstitute({ ...this.data, isActive: false, updatedAt: new Date() });
  }
}
