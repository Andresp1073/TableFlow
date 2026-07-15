export enum PaymentProviderStatus {
  Active = "active",
  Inactive = "inactive",
  Degraded = "degraded",
  Maintenance = "maintenance",
}

export type PaymentProviderFeature =
  | "create_payment"
  | "authorize_payment"
  | "capture_payment"
  | "cancel_payment"
  | "refund_payment"
  | "verify_status"
  | "tokenization"
  | "partial_refund"
  | "recurring_billing";

export interface PaymentProviderConfig {
  id: string;
  name: string;
  displayName: string;
  status: PaymentProviderStatus;
  supportedFeatures: PaymentProviderFeature[];
  supportedMethods: string[];
  isEnabled: boolean;
  priority: number;
  website?: string;
  documentationUrl?: string;
  metadata?: Record<string, string>;
}

export class PaymentProvider {
  private constructor(public readonly value: PaymentProviderConfig) {}

  static create(config: PaymentProviderConfig): PaymentProvider {
    if (!config.id.trim()) {
      throw new Error("Provider ID cannot be empty");
    }
    if (!config.name.trim()) {
      throw new Error("Provider name cannot be empty");
    }
    return new PaymentProvider({ ...config });
  }

  static reconstitute(config: PaymentProviderConfig): PaymentProvider {
    return new PaymentProvider(config);
  }

  equals(other: PaymentProvider): boolean {
    return this.value.id === other.value.id;
  }

  get id(): string {
    return this.value.id;
  }

  get name(): string {
    return this.value.name;
  }

  get displayName(): string {
    return this.value.displayName;
  }

  get status(): PaymentProviderStatus {
    return this.value.status;
  }

  get supportedFeatures(): readonly PaymentProviderFeature[] {
    return this.value.supportedFeatures;
  }

  get supportedMethods(): readonly string[] {
    return this.value.supportedMethods;
  }

  get isEnabled(): boolean {
    return this.value.isEnabled;
  }

  get priority(): number {
    return this.value.priority;
  }

  get website(): string | undefined {
    return this.value.website;
  }

  get documentationUrl(): string | undefined {
    return this.value.documentationUrl;
  }

  get metadata(): Record<string, string> | undefined {
    return this.value.metadata;
  }

  supportsFeature(feature: PaymentProviderFeature): boolean {
    return this.value.supportedFeatures.includes(feature);
  }

  supportsAllFeatures(features: PaymentProviderFeature[]): boolean {
    return features.every((f) => this.value.supportedFeatures.includes(f));
  }

  supportsMethod(methodId: string): boolean {
    return this.value.supportedMethods.includes(methodId);
  }

  isAvailable(): boolean {
    return this.value.isEnabled && this.value.status === PaymentProviderStatus.Active;
  }

  activate(): PaymentProvider {
    return PaymentProvider.reconstitute({ ...this.value, status: PaymentProviderStatus.Active });
  }

  deactivate(): PaymentProvider {
    return PaymentProvider.reconstitute({ ...this.value, status: PaymentProviderStatus.Inactive });
  }

  markDegraded(): PaymentProvider {
    return PaymentProvider.reconstitute({ ...this.value, status: PaymentProviderStatus.Degraded });
  }
}
