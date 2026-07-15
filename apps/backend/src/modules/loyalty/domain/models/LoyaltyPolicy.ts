export interface LoyaltyPolicyConfig {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  pointsExpirationDays: number | null;
  minimumRedemptionPoints: number;
  maximumPointsPerTransaction: number | null;
  enrollmentBonusPoints: number;
  birthdayBonusPoints: number;
  pointsRounding: "ceil" | "floor" | "round";
  allowNegativeBalance: boolean;
  redemptionRequiresValidation: boolean;
  redemptionRequiresApproval: boolean;
  maximumRedemptionsPerDay: number | null;
  daysUntilTierDowngrade: number | null;
  daysUntilTierUpgrade: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class LoyaltyPolicy {
  private constructor(public readonly value: LoyaltyPolicyConfig) {}

  static create(config: Omit<LoyaltyPolicyConfig, "isActive" | "createdAt" | "updatedAt">): LoyaltyPolicy {
    const now = new Date();
    return new LoyaltyPolicy({
      ...config,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(config: LoyaltyPolicyConfig): LoyaltyPolicy {
    return new LoyaltyPolicy(config);
  }

  get id(): string { return this.value.id; }
  get restaurantId(): string { return this.value.restaurantId; }
  get name(): string { return this.value.name; }
  get description(): string { return this.value.description; }
  get pointsExpirationDays(): number | null { return this.value.pointsExpirationDays; }
  get minimumRedemptionPoints(): number { return this.value.minimumRedemptionPoints; }
  get maximumPointsPerTransaction(): number | null { return this.value.maximumPointsPerTransaction; }
  get enrollmentBonusPoints(): number { return this.value.enrollmentBonusPoints; }
  get birthdayBonusPoints(): number { return this.value.birthdayBonusPoints; }
  get pointsRounding(): "ceil" | "floor" | "round" { return this.value.pointsRounding; }
  get allowNegativeBalance(): boolean { return this.value.allowNegativeBalance; }
  get redemptionRequiresValidation(): boolean { return this.value.redemptionRequiresValidation; }
  get redemptionRequiresApproval(): boolean { return this.value.redemptionRequiresApproval; }
  get maximumRedemptionsPerDay(): number | null { return this.value.maximumRedemptionsPerDay; }
  get daysUntilTierDowngrade(): number | null { return this.value.daysUntilTierDowngrade; }
  get daysUntilTierUpgrade(): number | null { return this.value.daysUntilTierUpgrade; }
  get isActive(): boolean { return this.value.isActive; }
  get createdAt(): Date { return this.value.createdAt; }
  get updatedAt(): Date { return this.value.updatedAt; }

  equals(other: LoyaltyPolicy): boolean { return this.value.id === other.value.id; }

  calculateExpirationDate(from: Date): Date | null {
    if (this.value.pointsExpirationDays === null) return null;
    const exp = new Date(from);
    exp.setDate(exp.getDate() + this.value.pointsExpirationDays);
    return exp;
  }

  validateRedemption(points: number, dailyRedemptions: number): string | null {
    if (points < this.value.minimumRedemptionPoints) return `Minimum redemption is ${this.value.minimumRedemptionPoints} points`;
    if (this.value.maximumRedemptionsPerDay !== null && dailyRedemptions >= this.value.maximumRedemptionsPerDay) return "Maximum daily redemptions reached";
    return null;
  }

  update(config: Partial<Omit<LoyaltyPolicyConfig, "id" | "restaurantId" | "createdAt">>): LoyaltyPolicy {
    return LoyaltyPolicy.reconstitute({ ...this.value, ...config, updatedAt: new Date() });
  }

  activate(): LoyaltyPolicy {
    return LoyaltyPolicy.reconstitute({ ...this.value, isActive: true, updatedAt: new Date() });
  }

  deactivate(): LoyaltyPolicy {
    return LoyaltyPolicy.reconstitute({ ...this.value, isActive: false, updatedAt: new Date() });
  }
}
