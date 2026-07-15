import type { PosCapability } from "./PosCapability.js";

export enum SynchronizationDirection {
  Pull = "pull",
  Push = "push",
  Bidirectional = "bidirectional",
}

export enum SynchronizationTrigger {
  Manual = "manual",
  Scheduled = "scheduled",
  Webhook = "webhook",
  Realtime = "realtime",
}

export enum ConflictResolutionStrategy {
  SourceWins = "source_wins",
  TargetWins = "target_wins",
  Manual = "manual",
  TimestampWins = "timestamp_wins",
}

export interface PosSynchronizationPolicyConfig {
  id: string;
  connectionId: string;
  direction: SynchronizationDirection;
  triggers: SynchronizationTrigger[];
  conflictResolution: ConflictResolutionStrategy;
  schedule?: string;
  enabledCapabilities: PosCapability[];
  retryCount: number;
  retryDelayMs: number;
  batchSize: number;
  isEnabled: boolean;
}

export class PosSynchronizationPolicy {
  private constructor(public readonly value: PosSynchronizationPolicyConfig) {}

  static create(config: PosSynchronizationPolicyConfig): PosSynchronizationPolicy {
    if (!config.id.trim()) {
      throw new Error("Policy ID cannot be empty");
    }
    if (!config.connectionId.trim()) {
      throw new Error("Connection ID cannot be empty");
    }
    if (config.retryCount < 0) {
      throw new Error("Retry count cannot be negative");
    }
    if (config.retryDelayMs < 0) {
      throw new Error("Retry delay cannot be negative");
    }
    if (config.batchSize < 1) {
      throw new Error("Batch size must be at least 1");
    }
    return new PosSynchronizationPolicy({ ...config });
  }

  static reconstitute(config: PosSynchronizationPolicyConfig): PosSynchronizationPolicy {
    return new PosSynchronizationPolicy(config);
  }

  equals(other: PosSynchronizationPolicy): boolean {
    return this.value.id === other.value.id;
  }

  get id(): string {
    return this.value.id;
  }

  get connectionId(): string {
    return this.value.connectionId;
  }

  get direction(): SynchronizationDirection {
    return this.value.direction;
  }

  get triggers(): readonly SynchronizationTrigger[] {
    return this.value.triggers;
  }

  get conflictResolution(): ConflictResolutionStrategy {
    return this.value.conflictResolution;
  }

  get schedule(): string | undefined {
    return this.value.schedule;
  }

  get enabledCapabilities(): readonly PosCapability[] {
    return this.value.enabledCapabilities;
  }

  get retryCount(): number {
    return this.value.retryCount;
  }

  get retryDelayMs(): number {
    return this.value.retryDelayMs;
  }

  get batchSize(): number {
    return this.value.batchSize;
  }

  get isEnabled(): boolean {
    return this.value.isEnabled;
  }

  isPullEnabled(): boolean {
    return (
      this.value.direction === SynchronizationDirection.Pull ||
      this.value.direction === SynchronizationDirection.Bidirectional
    );
  }

  isPushEnabled(): boolean {
    return (
      this.value.direction === SynchronizationDirection.Push ||
      this.value.direction === SynchronizationDirection.Bidirectional
    );
  }

  supportsTrigger(trigger: SynchronizationTrigger): boolean {
    return this.value.triggers.includes(trigger);
  }

  isSchedulable(): boolean {
    return (
      this.value.isEnabled &&
      this.supportsTrigger(SynchronizationTrigger.Scheduled) &&
      !!this.value.schedule
    );
  }

  enable(): PosSynchronizationPolicy {
    return PosSynchronizationPolicy.reconstitute({ ...this.value, isEnabled: true });
  }

  disable(): PosSynchronizationPolicy {
    return PosSynchronizationPolicy.reconstitute({ ...this.value, isEnabled: false });
  }

  withDirection(direction: SynchronizationDirection): PosSynchronizationPolicy {
    return PosSynchronizationPolicy.reconstitute({ ...this.value, direction });
  }
}
