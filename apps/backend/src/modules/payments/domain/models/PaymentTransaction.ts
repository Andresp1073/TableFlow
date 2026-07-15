export enum PaymentTransactionStatus {
  Created = "created",
  Pending = "pending",
  Authorized = "authorized",
  Captured = "captured",
  Failed = "failed",
  Cancelled = "cancelled",
  Refunded = "refunded",
  Expired = "expired",
}

export const PAYMENT_TRANSACTION_TRANSITIONS: Record<PaymentTransactionStatus, readonly PaymentTransactionStatus[]> = {
  [PaymentTransactionStatus.Created]: [
    PaymentTransactionStatus.Pending,
    PaymentTransactionStatus.Failed,
    PaymentTransactionStatus.Cancelled,
  ],
  [PaymentTransactionStatus.Pending]: [
    PaymentTransactionStatus.Authorized,
    PaymentTransactionStatus.Failed,
    PaymentTransactionStatus.Cancelled,
    PaymentTransactionStatus.Expired,
  ],
  [PaymentTransactionStatus.Authorized]: [
    PaymentTransactionStatus.Captured,
    PaymentTransactionStatus.Failed,
    PaymentTransactionStatus.Cancelled,
  ],
  [PaymentTransactionStatus.Captured]: [
    PaymentTransactionStatus.Refunded,
    PaymentTransactionStatus.Failed,
  ],
  [PaymentTransactionStatus.Failed]: [],
  [PaymentTransactionStatus.Cancelled]: [],
  [PaymentTransactionStatus.Refunded]: [],
  [PaymentTransactionStatus.Expired]: [],
};

export type RefundType = "full" | "partial";

export interface RefundEntry {
  id: string;
  amount: number;
  currency: string;
  reason: string | null;
  type: RefundType;
  approvedBy: string | null;
  providerReference: string | null;
  createdAt: Date;
}

export interface PaymentTransactionConfig {
  id: string;
  intentId: string;
  providerId: string;
  restaurantId: string;
  reservationId?: string;
  customerId?: string;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  methodType: string;
  providerReference: string | null;
  authorizationCode: string | null;
  capturedAmount: number | null;
  refundedAmount: number;
  refunds: RefundEntry[];
  errorMessage: string | null;
  metadata: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  authorizedAt: Date | null;
  capturedAt: Date | null;
  expiresAt: Date | null;
}

export class PaymentTransaction {
  private constructor(public readonly value: PaymentTransactionConfig) {}

  static create(config: Omit<PaymentTransactionConfig, "status" | "createdAt" | "updatedAt" | "refundedAmount" | "refunds">): PaymentTransaction {
    const now = new Date();
    return new PaymentTransaction({
      ...config,
      status: PaymentTransactionStatus.Created,
      refundedAmount: 0,
      refunds: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(config: PaymentTransactionConfig): PaymentTransaction {
    return new PaymentTransaction(config);
  }

  equals(other: PaymentTransaction): boolean {
    return this.value.id === other.value.id;
  }

  get id(): string {
    return this.value.id;
  }

  get intentId(): string {
    return this.value.intentId;
  }

  get providerId(): string {
    return this.value.providerId;
  }

  get restaurantId(): string {
    return this.value.restaurantId;
  }

  get reservationId(): string | undefined {
    return this.value.reservationId;
  }

  get customerId(): string | undefined {
    return this.value.customerId;
  }

  get amount(): number {
    return this.value.amount;
  }

  get currency(): string {
    return this.value.currency;
  }

  get status(): PaymentTransactionStatus {
    return this.value.status;
  }

  get methodType(): string {
    return this.value.methodType;
  }

  get providerReference(): string | null {
    return this.value.providerReference;
  }

  get authorizationCode(): string | null {
    return this.value.authorizationCode;
  }

  get capturedAmount(): number | null {
    return this.value.capturedAmount;
  }

  get refundedAmount(): number {
    return this.value.refundedAmount;
  }

  get refunds(): readonly RefundEntry[] {
    return this.value.refunds;
  }

  get errorMessage(): string | null {
    return this.value.errorMessage;
  }

  get metadata(): Record<string, string> {
    return { ...this.value.metadata };
  }

  get createdAt(): Date {
    return this.value.createdAt;
  }

  get updatedAt(): Date {
    return this.value.updatedAt;
  }

  get authorizedAt(): Date | null {
    return this.value.authorizedAt;
  }

  get capturedAt(): Date | null {
    return this.value.capturedAt;
  }

  get expiresAt(): Date | null {
    return this.value.expiresAt;
  }

  canTransitionTo(target: PaymentTransactionStatus): boolean {
    const allowed = PAYMENT_TRANSACTION_TRANSITIONS[this.value.status];
    return allowed.includes(target);
  }

  transitionTo(
    target: PaymentTransactionStatus,
    overrides?: Partial<Pick<PaymentTransactionConfig, "providerReference" | "authorizationCode" | "capturedAmount" | "errorMessage">>,
  ): PaymentTransaction {
    if (!this.canTransitionTo(target)) {
      throw new Error(
        `Cannot transition from ${this.value.status} to ${target}`,
      );
    }

    const now = new Date();
    const updates: Partial<PaymentTransactionConfig> = {
      status: target,
      updatedAt: now,
      ...overrides,
    };

    if (target === PaymentTransactionStatus.Authorized) {
      updates.authorizedAt = now;
    }
    if (target === PaymentTransactionStatus.Captured) {
      updates.capturedAt = now;
      updates.capturedAmount = overrides?.capturedAmount ?? this.value.amount;
    }

    return PaymentTransaction.reconstitute({ ...this.value, ...updates });
  }

  addRefund(refund: RefundEntry): PaymentTransaction {
    const newRefundedAmount = this.value.refundedAmount + refund.amount;

    if (newRefundedAmount > this.value.amount) {
      throw new Error("Refund amount exceeds transaction amount");
    }

    return PaymentTransaction.reconstitute({
      ...this.value,
      refundedAmount: newRefundedAmount,
      refunds: [...this.value.refunds, refund],
      status: newRefundedAmount >= this.value.amount
        ? PaymentTransactionStatus.Refunded
        : this.value.status,
      updatedAt: new Date(),
    });
  }

  getRemainingRefundableAmount(): number {
    return this.value.amount - this.value.refundedAmount;
  }

  isFullyRefunded(): boolean {
    return this.value.refundedAmount >= this.value.amount;
  }

  isPartialRefunded(): boolean {
    return this.value.refundedAmount > 0 && this.value.refundedAmount < this.value.amount;
  }

  isExpired(): boolean {
    if (!this.value.expiresAt) {
      return false;
    }
    return new Date() > this.value.expiresAt;
  }
}
