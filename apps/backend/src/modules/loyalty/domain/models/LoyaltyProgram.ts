export interface TierConfig {
  name: string;
  minimumLifetimePoints: number;
  pointsMultiplier: number;
  benefits: string[];
}

export interface ProgramRule {
  key: string;
  value: string | number | boolean;
  description: string;
}

export interface LoyaltyProgramConfig {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  pointsPerCurrencyUnit: number;
  currencyUnit: string;
  tiers: TierConfig[];
  rules: ProgramRule[];
  enrollmentBonusPoints: number;
  birthdayBonusPoints: number;
  pointsExpirationDays: number | null;
  minimumRedemptionPoints: number;
  isActive: boolean;
  startAt: Date;
  endAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class LoyaltyProgram {
  private constructor(public readonly value: LoyaltyProgramConfig) {}

  static create(config: Omit<LoyaltyProgramConfig, "isActive" | "createdAt" | "updatedAt">): LoyaltyProgram {
    const now = new Date();
    return new LoyaltyProgram({
      ...config,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(config: LoyaltyProgramConfig): LoyaltyProgram {
    return new LoyaltyProgram(config);
  }

  get id(): string { return this.value.id; }
  get restaurantId(): string { return this.value.restaurantId; }
  get name(): string { return this.value.name; }
  get description(): string { return this.value.description; }
  get pointsPerCurrencyUnit(): number { return this.value.pointsPerCurrencyUnit; }
  get currencyUnit(): string { return this.value.currencyUnit; }
  get tiers(): readonly TierConfig[] { return this.value.tiers; }
  get rules(): readonly ProgramRule[] { return this.value.rules; }
  get enrollmentBonusPoints(): number { return this.value.enrollmentBonusPoints; }
  get birthdayBonusPoints(): number { return this.value.birthdayBonusPoints; }
  get pointsExpirationDays(): number | null { return this.value.pointsExpirationDays; }
  get minimumRedemptionPoints(): number { return this.value.minimumRedemptionPoints; }
  get isActive(): boolean { return this.value.isActive; }
  get startAt(): Date { return this.value.startAt; }
  get endAt(): Date | null { return this.value.endAt; }
  get createdAt(): Date { return this.value.createdAt; }
  get updatedAt(): Date { return this.value.updatedAt; }

  equals(other: LoyaltyProgram): boolean { return this.value.id === other.value.id; }

  isCurrentlyActive(): boolean {
    if (!this.value.isActive) return false;
    const now = new Date();
    if (now < this.value.startAt) return false;
    if (this.value.endAt && now > this.value.endAt) return false;
    return true;
  }

  getTierForPoints(lifetimePoints: number): TierConfig {
    let highest = this.value.tiers[0];
    for (const tier of this.value.tiers) {
      if (lifetimePoints >= tier.minimumLifetimePoints) {
        highest = tier;
      }
    }
    return highest;
  }

  calculatePoints(spentAmount: number, tierMultiplier: number): number {
    const base = spentAmount * this.value.pointsPerCurrencyUnit;
    return Math.round(base * tierMultiplier);
  }

  update(config: Partial<Omit<LoyaltyProgramConfig, "id" | "restaurantId" | "createdAt">>): LoyaltyProgram {
    return LoyaltyProgram.reconstitute({ ...this.value, ...config, updatedAt: new Date() });
  }

  activate(): LoyaltyProgram {
    return LoyaltyProgram.reconstitute({ ...this.value, isActive: true, updatedAt: new Date() });
  }

  deactivate(): LoyaltyProgram {
    return LoyaltyProgram.reconstitute({ ...this.value, isActive: false, updatedAt: new Date() });
  }
}
