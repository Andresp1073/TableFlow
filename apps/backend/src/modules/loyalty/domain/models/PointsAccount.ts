import { CustomerTier } from "./CustomerProfile.js";

export interface PointsAccountConfig {
  id: string;
  customerProfileId: string;
  programId: string;
  restaurantId: string;
  currentBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  currentTier: CustomerTier;
  enrolledAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
}

export class PointsAccount {
  private constructor(public readonly value: PointsAccountConfig) {}

  static create(config: Omit<PointsAccountConfig, "currentBalance" | "lifetimePointsEarned" | "lifetimePointsRedeemed" | "currentTier" | "enrolledAt" | "lastActivityAt" | "isActive">): PointsAccount {
    const now = new Date();
    return new PointsAccount({
      ...config,
      currentBalance: 0,
      lifetimePointsEarned: 0,
      lifetimePointsRedeemed: 0,
      currentTier: CustomerTier.Bronze,
      enrolledAt: now,
      lastActivityAt: now,
      isActive: true,
    });
  }

  static reconstitute(config: PointsAccountConfig): PointsAccount {
    return new PointsAccount(config);
  }

  get id(): string { return this.value.id; }
  get customerProfileId(): string { return this.value.customerProfileId; }
  get programId(): string { return this.value.programId; }
  get restaurantId(): string { return this.value.restaurantId; }
  get currentBalance(): number { return this.value.currentBalance; }
  get lifetimePointsEarned(): number { return this.value.lifetimePointsEarned; }
  get lifetimePointsRedeemed(): number { return this.value.lifetimePointsRedeemed; }
  get currentTier(): CustomerTier { return this.value.currentTier; }
  get enrolledAt(): Date { return this.value.enrolledAt; }
  get lastActivityAt(): Date { return this.value.lastActivityAt; }
  get isActive(): boolean { return this.value.isActive; }

  equals(other: PointsAccount): boolean { return this.value.id === other.value.id; }

  credit(points: number): PointsAccount {
    if (points <= 0) throw new Error("Points to credit must be positive");
    return PointsAccount.reconstitute({
      ...this.value,
      currentBalance: this.value.currentBalance + points,
      lifetimePointsEarned: this.value.lifetimePointsEarned + points,
      lastActivityAt: new Date(),
    });
  }

  debit(points: number): PointsAccount {
    if (points <= 0) throw new Error("Points to debit must be positive");
    if (this.value.currentBalance < points) throw new Error("Insufficient points balance");
    return PointsAccount.reconstitute({
      ...this.value,
      currentBalance: this.value.currentBalance - points,
      lifetimePointsRedeemed: this.value.lifetimePointsRedeemed + points,
      lastActivityAt: new Date(),
    });
  }

  adjust(points: number): PointsAccount {
    const newBalance = this.value.currentBalance + points;
    if (newBalance < 0) throw new Error("Adjustment would result in negative balance");
    return PointsAccount.reconstitute({
      ...this.value,
      currentBalance: newBalance,
      lifetimePointsEarned: points > 0 ? this.value.lifetimePointsEarned + points : this.value.lifetimePointsEarned,
      lastActivityAt: new Date(),
    });
  }

  updateTier(tier: CustomerTier): PointsAccount {
    return PointsAccount.reconstitute({ ...this.value, currentTier: tier, lastActivityAt: new Date() });
  }

  deactivate(): PointsAccount {
    return PointsAccount.reconstitute({ ...this.value, isActive: false, lastActivityAt: new Date() });
  }

  activate(): PointsAccount {
    return PointsAccount.reconstitute({ ...this.value, isActive: true, lastActivityAt: new Date() });
  }
}
