export enum PaymentIntentStatus {
  Created = "created",
  Pending = "pending",
  Processing = "processing",
  Succeeded = "succeeded",
  Failed = "failed",
  Cancelled = "cancelled",
  Expired = "expired",
}

export interface PaymentIntentConfig {
  id: string;
  amount: number;
  currency: string;
  reference: string;
  customerId?: string;
  customerEmail?: string;
  restaurantId: string;
  reservationId?: string;
  description?: string;
  status: PaymentIntentStatus;
  allowedMethods: string[];
  metadata: Record<string, string>;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentIntent {
  private constructor(public readonly value: PaymentIntentConfig) {}

  static create(config: Omit<PaymentIntentConfig, "status" | "createdAt" | "updatedAt">): PaymentIntent {
    const now = new Date();

    if (config.amount <= 0) {
      throw new Error("Amount must be positive");
    }
    if (!config.reference.trim()) {
      throw new Error("Reference cannot be empty");
    }

    return new PaymentIntent({
      ...config,
      status: PaymentIntentStatus.Created,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(config: PaymentIntentConfig): PaymentIntent {
    return new PaymentIntent(config);
  }

  equals(other: PaymentIntent): boolean {
    return this.value.id === other.value.id;
  }

  get id(): string {
    return this.value.id;
  }

  get amount(): number {
    return this.value.amount;
  }

  get currency(): string {
    return this.value.currency;
  }

  get reference(): string {
    return this.value.reference;
  }

  get customerId(): string | undefined {
    return this.value.customerId;
  }

  get customerEmail(): string | undefined {
    return this.value.customerEmail;
  }

  get restaurantId(): string {
    return this.value.restaurantId;
  }

  get reservationId(): string | undefined {
    return this.value.reservationId;
  }

  get description(): string | undefined {
    return this.value.description;
  }

  get status(): PaymentIntentStatus {
    return this.value.status;
  }

  get allowedMethods(): readonly string[] {
    return this.value.allowedMethods;
  }

  get metadata(): Record<string, string> {
    return { ...this.value.metadata };
  }

  get expiresAt(): Date | null {
    return this.value.expiresAt;
  }

  get createdAt(): Date {
    return this.value.createdAt;
  }

  get updatedAt(): Date {
    return this.value.updatedAt;
  }

  markProcessing(): PaymentIntent {
    return PaymentIntent.reconstitute({ ...this.value, status: PaymentIntentStatus.Processing, updatedAt: new Date() });
  }

  markSucceeded(): PaymentIntent {
    return PaymentIntent.reconstitute({ ...this.value, status: PaymentIntentStatus.Succeeded, updatedAt: new Date() });
  }

  markFailed(errorMessage?: string): PaymentIntent {
    return PaymentIntent.reconstitute({
      ...this.value,
      status: PaymentIntentStatus.Failed,
      updatedAt: new Date(),
      metadata: errorMessage ? { ...this.value.metadata, failureReason: errorMessage } : this.value.metadata,
    });
  }

  markCancelled(): PaymentIntent {
    return PaymentIntent.reconstitute({ ...this.value, status: PaymentIntentStatus.Cancelled, updatedAt: new Date() });
  }

  isExpired(): boolean {
    if (!this.value.expiresAt) {
      return false;
    }
    return new Date() > this.value.expiresAt;
  }

  isSettled(): boolean {
    return this.value.status === PaymentIntentStatus.Succeeded
      || this.value.status === PaymentIntentStatus.Failed
      || this.value.status === PaymentIntentStatus.Cancelled
      || this.value.status === PaymentIntentStatus.Expired;
  }
}
