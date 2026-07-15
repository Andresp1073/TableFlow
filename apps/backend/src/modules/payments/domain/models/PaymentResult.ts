export enum PaymentResultStatus {
  Success = "success",
  Failure = "failure",
  Pending = "pending",
  RequiresAction = "requires_action",
}

export interface PaymentResultConfig {
  status: PaymentResultStatus;
  transactionId: string;
  providerReference: string;
  authorizationCode: string | null;
  amount: number;
  currency: string;
  feeAmount: number | null;
  errorMessage: string | null;
  errorCode: string | null;
  requiresRedirect: boolean;
  redirectUrl: string | null;
  rawResponse: Record<string, unknown> | null;
  processedAt: Date;
}

export class PaymentResult {
  private constructor(public readonly value: PaymentResultConfig) {}

  static create(config: PaymentResultConfig): PaymentResult {
    return new PaymentResult({ ...config });
  }

  static reconstitute(config: PaymentResultConfig): PaymentResult {
    return new PaymentResult(config);
  }

  get status(): PaymentResultStatus {
    return this.value.status;
  }

  get transactionId(): string {
    return this.value.transactionId;
  }

  get providerReference(): string {
    return this.value.providerReference;
  }

  get authorizationCode(): string | null {
    return this.value.authorizationCode;
  }

  get amount(): number {
    return this.value.amount;
  }

  get currency(): string {
    return this.value.currency;
  }

  get feeAmount(): number | null {
    return this.value.feeAmount;
  }

  get errorMessage(): string | null {
    return this.value.errorMessage;
  }

  get errorCode(): string | null {
    return this.value.errorCode;
  }

  get requiresRedirect(): boolean {
    return this.value.requiresRedirect;
  }

  get redirectUrl(): string | null {
    return this.value.redirectUrl;
  }

  get rawResponse(): Record<string, unknown> | null {
    return this.value.rawResponse;
  }

  get processedAt(): Date {
    return this.value.processedAt;
  }

  isSuccess(): boolean {
    return this.value.status === PaymentResultStatus.Success;
  }

  isFailure(): boolean {
    return this.value.status === PaymentResultStatus.Failure;
  }

  isPending(): boolean {
    return this.value.status === PaymentResultStatus.Pending;
  }

  requiresAction(): boolean {
    return this.value.status === PaymentResultStatus.RequiresAction;
  }
}
