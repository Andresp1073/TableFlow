export enum RewardType {
  Discount = "discount",
  FreeProduct = "free_product",
  PriorityReservation = "priority_reservation",
  ExclusiveExperience = "exclusive_experience",
  Custom = "custom",
}

export interface RewardConfig {
  id: string;
  programId: string;
  restaurantId: string;
  name: string;
  description: string;
  type: RewardType;
  costInPoints: number;
  value: number;
  valueCurrency: string;
  imageUrl?: string;
  termsConditions: string;
  isActive: boolean;
  validFrom: Date;
  validTo: Date | null;
  maxRedemptionsPerCustomer: number | null;
  totalQuantity: number | null;
  remainingQuantity: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Reward {
  private constructor(public readonly data: RewardConfig) {}

  static create(config: Omit<RewardConfig, "isActive" | "createdAt" | "updatedAt">): Reward {
    const now = new Date();
    return new Reward({
      ...config,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(config: RewardConfig): Reward {
    return new Reward(config);
  }

  get id(): string { return this.data.id; }
  get programId(): string { return this.data.programId; }
  get restaurantId(): string { return this.data.restaurantId; }
  get name(): string { return this.data.name; }
  get description(): string { return this.data.description; }
  get type(): RewardType { return this.data.type; }
  get costInPoints(): number { return this.data.costInPoints; }
  get monetaryValue(): number { return this.data.value; }
  get valueCurrency(): string { return this.data.valueCurrency; }
  get termsConditions(): string { return this.data.termsConditions; }
  get isActive(): boolean { return this.data.isActive; }
  get validFrom(): Date { return this.data.validFrom; }
  get validTo(): Date | null { return this.data.validTo; }
  get maxRedemptionsPerCustomer(): number | null { return this.data.maxRedemptionsPerCustomer; }
  get totalQuantity(): number | null { return this.data.totalQuantity; }
  get remainingQuantity(): number | null { return this.data.remainingQuantity; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  equals(other: Reward): boolean { return this.data.id === other.data.id; }

  isCurrentlyAvailable(): boolean {
    if (!this.data.isActive) return false;
    const now = new Date();
    if (now < this.data.validFrom) return false;
    if (this.data.validTo && now > this.data.validTo) return false;
    if (this.data.remainingQuantity !== null && this.data.remainingQuantity <= 0) return false;
    return true;
  }

  canBeRedeemedByCustomer(previousRedemptions: number): boolean {
    if (!this.isCurrentlyAvailable()) return false;
    if (this.data.maxRedemptionsPerCustomer !== null && previousRedemptions >= this.data.maxRedemptionsPerCustomer) return false;
    return true;
  }

  redeem(): Reward {
    if (this.data.remainingQuantity !== null) {
      if (this.data.remainingQuantity <= 0) throw new Error("No remaining quantity for this reward");
      return Reward.reconstitute({ ...this.data, remainingQuantity: this.data.remainingQuantity - 1, updatedAt: new Date() });
    }
    return this;
  }

  updateQuantity(quantity: number): Reward {
    return Reward.reconstitute({ ...this.data, remainingQuantity: quantity, updatedAt: new Date() });
  }

  activate(): Reward {
    return Reward.reconstitute({ ...this.data, isActive: true, updatedAt: new Date() });
  }

  deactivate(): Reward {
    return Reward.reconstitute({ ...this.data, isActive: false, updatedAt: new Date() });
  }
}
