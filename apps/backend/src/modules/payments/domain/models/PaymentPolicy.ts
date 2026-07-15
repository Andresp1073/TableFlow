export enum PaymentPolicyType {
  Authorization = "authorization",
  Capture = "capture",
  Refund = "refund",
  Fraud = "fraud",
}

export enum AuthorizationExpiryAction {
  Cancel = "cancel",
  Notify = "notify",
  AttemptCapture = "attempt_capture",
}

export interface PaymentPolicyConfig {
  id: string;
  name: string;
  type: PaymentPolicyType;
  isEnabled: boolean;
  rules: Record<string, unknown>;
  priority: number;
  description?: string;
}

export class PaymentPolicy {
  private constructor(public readonly value: PaymentPolicyConfig) {}

  static create(config: PaymentPolicyConfig): PaymentPolicy {
    if (!config.id.trim()) {
      throw new Error("Policy ID cannot be empty");
    }
    if (!config.name.trim()) {
      throw new Error("Policy name cannot be empty");
    }
    return new PaymentPolicy({ ...config });
  }

  static reconstitute(config: PaymentPolicyConfig): PaymentPolicy {
    return new PaymentPolicy(config);
  }

  equals(other: PaymentPolicy): boolean {
    return this.value.id === other.value.id;
  }

  get id(): string {
    return this.value.id;
  }

  get name(): string {
    return this.value.name;
  }

  get type(): PaymentPolicyType {
    return this.value.type;
  }

  get isEnabled(): boolean {
    return this.value.isEnabled;
  }

  get rules(): Record<string, unknown> {
    return { ...this.value.rules };
  }

  get priority(): number {
    return this.value.priority;
  }

  get description(): string | undefined {
    return this.value.description;
  }

  enable(): PaymentPolicy {
    return PaymentPolicy.reconstitute({ ...this.value, isEnabled: true });
  }

  disable(): PaymentPolicy {
    return PaymentPolicy.reconstitute({ ...this.value, isEnabled: false });
  }

  getRule<T>(key: string, defaultValue: T): T {
    const value = this.value.rules[key];
    return (value !== undefined ? value : defaultValue) as T;
  }

  static createAuthorizationPolicy(
    id: string,
    maxAuthorizationTimeMs: number,
    expiryAction: AuthorizationExpiryAction,
  ): PaymentPolicy {
    return PaymentPolicy.create({
      id,
      name: "Default Authorization Policy",
      type: PaymentPolicyType.Authorization,
      isEnabled: true,
      priority: 100,
      rules: {
        maxAuthorizationTimeMs,
        expiryAction,
        allowPartialCaptures: false,
      },
    });
  }

  static createCapturePolicy(
    id: string,
    captureDelayMs: number,
    autoCapture: boolean,
  ): PaymentPolicy {
    return PaymentPolicy.create({
      id,
      name: "Default Capture Policy",
      type: PaymentPolicyType.Capture,
      isEnabled: true,
      priority: 100,
      rules: {
        captureDelayMs,
        autoCapture,
        maximumCaptureAttempts: 3,
      },
    });
  }

  static createRefundPolicy(
    id: string,
    requireApprovalAbove: number,
    maxRefundDays: number,
  ): PaymentPolicy {
    return PaymentPolicy.create({
      id,
      name: "Default Refund Policy",
      type: PaymentPolicyType.Refund,
      isEnabled: true,
      priority: 100,
      rules: {
        requireApprovalAbove,
        maxRefundDays,
        allowPartialRefunds: true,
        maxRefundAttempts: 3,
      },
    });
  }
}
