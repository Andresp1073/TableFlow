export enum RedemptionStatus {
  Requested = "requested",
  Validated = "validated",
  Approved = "approved",
  Completed = "completed",
  Cancelled = "cancelled",
}

export const REDEMPTION_TRANSITIONS: Record<RedemptionStatus, readonly RedemptionStatus[]> = {
  [RedemptionStatus.Requested]: [RedemptionStatus.Validated, RedemptionStatus.Cancelled],
  [RedemptionStatus.Validated]: [RedemptionStatus.Approved, RedemptionStatus.Cancelled],
  [RedemptionStatus.Approved]: [RedemptionStatus.Completed, RedemptionStatus.Cancelled],
  [RedemptionStatus.Completed]: [],
  [RedemptionStatus.Cancelled]: [],
};

export interface RewardRedemptionConfig {
  id: string;
  rewardId: string;
  rewardName: string;
  accountId: string;
  customerProfileId: string;
  restaurantId: string;
  status: RedemptionStatus;
  pointsCost: number;
  referenceId: string;
  referenceType: string;
  requestedAt: Date;
  validatedAt: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  notes: string;
}

export class RewardRedemption {
  private constructor(public readonly value: RewardRedemptionConfig) {}

  static create(config: Omit<RewardRedemptionConfig, "status" | "requestedAt" | "validatedAt" | "approvedAt" | "approvedBy" | "completedAt" | "cancelledAt" | "cancellationReason" | "notes">): RewardRedemption {
    return new RewardRedemption({
      ...config,
      status: RedemptionStatus.Requested,
      requestedAt: new Date(),
      validatedAt: null,
      approvedBy: null,
      approvedAt: null,
      completedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      notes: "",
    });
  }

  static reconstitute(config: RewardRedemptionConfig): RewardRedemption {
    return new RewardRedemption(config);
  }

  get id(): string { return this.value.id; }
  get rewardId(): string { return this.value.rewardId; }
  get rewardName(): string { return this.value.rewardName; }
  get accountId(): string { return this.value.accountId; }
  get customerProfileId(): string { return this.value.customerProfileId; }
  get restaurantId(): string { return this.value.restaurantId; }
  get status(): RedemptionStatus { return this.value.status; }
  get pointsCost(): number { return this.value.pointsCost; }
  get referenceId(): string { return this.value.referenceId; }
  get referenceType(): string { return this.value.referenceType; }
  get requestedAt(): Date { return this.value.requestedAt; }
  get validatedAt(): Date | null { return this.value.validatedAt; }
  get approvedBy(): string | null { return this.value.approvedBy; }
  get approvedAt(): Date | null { return this.value.approvedAt; }
  get completedAt(): Date | null { return this.value.completedAt; }
  get cancelledAt(): Date | null { return this.value.cancelledAt; }
  get cancellationReason(): string | null { return this.value.cancellationReason; }
  get notes(): string { return this.value.notes; }

  private transitionTo(target: RedemptionStatus, updates?: Partial<RewardRedemptionConfig>): RewardRedemption {
    if (!REDEMPTION_TRANSITIONS[this.value.status].includes(target)) {
      throw new Error(`Cannot transition from ${this.value.status} to ${target}`);
    }
    return RewardRedemption.reconstitute({ ...this.value, ...updates, status: target });
  }

  validate(): RewardRedemption {
    return this.transitionTo(RedemptionStatus.Validated, { validatedAt: new Date() });
  }

  approve(approvedBy: string): RewardRedemption {
    return this.transitionTo(RedemptionStatus.Approved, { approvedBy, approvedAt: new Date() });
  }

  complete(): RewardRedemption {
    return this.transitionTo(RedemptionStatus.Completed, { completedAt: new Date() });
  }

  cancel(reason: string): RewardRedemption {
    return this.transitionTo(RedemptionStatus.Cancelled, { cancelledAt: new Date(), cancellationReason: reason });
  }
}
