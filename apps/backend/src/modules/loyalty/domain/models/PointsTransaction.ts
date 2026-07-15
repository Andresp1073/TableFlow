export enum PointsTransactionType {
  Earn = "earn",
  Redeem = "redeem",
  Bonus = "bonus",
  Adjustment = "adjustment",
  Expiration = "expiration",
  Refund = "refund",
}

export interface PointsTransactionConfig {
  id: string;
  accountId: string;
  type: PointsTransactionType;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string;
  referenceType: string;
  description: string;
  expiresAt: Date | null;
  performedBy: string;
  createdAt: Date;
}

export class PointsTransaction {
  private constructor(public readonly value: PointsTransactionConfig) {}

  static create(config: Omit<PointsTransactionConfig, "createdAt">): PointsTransaction {
    return new PointsTransaction({
      ...config,
      createdAt: new Date(),
    });
  }

  static reconstitute(config: PointsTransactionConfig): PointsTransaction {
    return new PointsTransaction(config);
  }

  get id(): string { return this.value.id; }
  get accountId(): string { return this.value.accountId; }
  get type(): PointsTransactionType { return this.value.type; }
  get points(): number { return this.value.points; }
  get balanceBefore(): number { return this.value.balanceBefore; }
  get balanceAfter(): number { return this.value.balanceAfter; }
  get referenceId(): string { return this.value.referenceId; }
  get referenceType(): string { return this.value.referenceType; }
  get description(): string { return this.value.description; }
  get expiresAt(): Date | null { return this.value.expiresAt; }
  get performedBy(): string { return this.value.performedBy; }
  get createdAt(): Date { return this.value.createdAt; }

  isExpired(): boolean {
    if (!this.value.expiresAt) return false;
    return new Date() > this.value.expiresAt;
  }

  isCredit(): boolean {
    return [PointsTransactionType.Earn, PointsTransactionType.Bonus, PointsTransactionType.Refund].includes(this.value.type);
  }

  isDebit(): boolean {
    return [PointsTransactionType.Redeem, PointsTransactionType.Expiration].includes(this.value.type);
  }

  canReverse(): boolean {
    return this.value.type === PointsTransactionType.Earn
      || this.value.type === PointsTransactionType.Redeem
      || this.value.type === PointsTransactionType.Bonus;
  }
}
