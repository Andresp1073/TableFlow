export enum PaymentMethodType {
  CreditCard = "credit_card",
  DebitCard = "debit_card",
  DigitalWallet = "digital_wallet",
  BankTransfer = "bank_transfer",
  Cash = "cash",
  GiftCard = "gift_card",
}

export const PAYMENT_METHOD_TYPES: readonly PaymentMethodType[] = Object.values(PaymentMethodType);

export interface PaymentMethodConfig {
  id: string;
  type: PaymentMethodType;
  displayName: string;
  providerId: string;
  isEnabled: boolean;
  requiresTokenization: boolean;
  processingTimeMs: number;
  metadata?: Record<string, string>;
}

export class PaymentMethod {
  private constructor(public readonly value: PaymentMethodConfig) {}

  static create(config: PaymentMethodConfig): PaymentMethod {
    if (!config.id.trim()) {
      throw new Error("Payment method ID cannot be empty");
    }
    if (!config.displayName.trim()) {
      throw new Error("Payment method display name cannot be empty");
    }
    return new PaymentMethod({ ...config });
  }

  static reconstitute(config: PaymentMethodConfig): PaymentMethod {
    return new PaymentMethod(config);
  }

  equals(other: PaymentMethod): boolean {
    return this.value.id === other.value.id;
  }

  get id(): string {
    return this.value.id;
  }

  get type(): PaymentMethodType {
    return this.value.type;
  }

  get displayName(): string {
    return this.value.displayName;
  }

  get providerId(): string {
    return this.value.providerId;
  }

  get isEnabled(): boolean {
    return this.value.isEnabled;
  }

  get requiresTokenization(): boolean {
    return this.value.requiresTokenization;
  }

  get processingTimeMs(): number {
    return this.value.processingTimeMs;
  }

  get metadata(): Record<string, string> | undefined {
    return this.value.metadata;
  }

  enable(): PaymentMethod {
    return PaymentMethod.reconstitute({ ...this.value, isEnabled: true });
  }

  disable(): PaymentMethod {
    return PaymentMethod.reconstitute({ ...this.value, isEnabled: false });
  }

  isCard(): boolean {
    return this.value.type === PaymentMethodType.CreditCard
      || this.value.type === PaymentMethodType.DebitCard;
  }

  isDigital(): boolean {
    return this.value.type === PaymentMethodType.DigitalWallet
      || this.value.type === PaymentMethodType.BankTransfer;
  }
}
