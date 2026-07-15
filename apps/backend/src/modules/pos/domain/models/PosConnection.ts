export enum PosConnectionStatus {
  Connected = "connected",
  Disconnected = "disconnected",
  Pending = "pending",
  Expired = "expired",
  Failed = "failed",
}

export const POS_CONNECTION_TRANSITIONS: Record<PosConnectionStatus, readonly PosConnectionStatus[]> = {
  [PosConnectionStatus.Pending]: [
    PosConnectionStatus.Connected,
    PosConnectionStatus.Failed,
    PosConnectionStatus.Disconnected,
  ],
  [PosConnectionStatus.Connected]: [
    PosConnectionStatus.Disconnected,
    PosConnectionStatus.Expired,
    PosConnectionStatus.Failed,
  ],
  [PosConnectionStatus.Disconnected]: [
    PosConnectionStatus.Pending,
    PosConnectionStatus.Connected,
  ],
  [PosConnectionStatus.Expired]: [
    PosConnectionStatus.Pending,
    PosConnectionStatus.Disconnected,
    PosConnectionStatus.Connected,
  ],
  [PosConnectionStatus.Failed]: [
    PosConnectionStatus.Pending,
    PosConnectionStatus.Disconnected,
  ],
};

export interface PosConnectionConfig {
  id: string;
  providerId: string;
  restaurantId: string;
  branchId?: string;
  status: PosConnectionStatus;
  credentialsKey: string;
  configuration: Record<string, string>;
  connectedAt: Date | null;
  lastHealthCheckAt: Date | null;
  lastSynchronizationAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PosConnection {
  private constructor(public readonly value: PosConnectionConfig) {}

  static create(config: Omit<PosConnectionConfig, "createdAt" | "updatedAt" | "status">): PosConnection {
    const now = new Date();
    return new PosConnection({
      ...config,
      status: PosConnectionStatus.Pending,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(config: PosConnectionConfig): PosConnection {
    return new PosConnection(config);
  }

  equals(other: PosConnection): boolean {
    return this.value.id === other.value.id;
  }

  get id(): string {
    return this.value.id;
  }

  get providerId(): string {
    return this.value.providerId;
  }

  get restaurantId(): string {
    return this.value.restaurantId;
  }

  get branchId(): string | undefined {
    return this.value.branchId;
  }

  get status(): PosConnectionStatus {
    return this.value.status;
  }

  get credentialsKey(): string {
    return this.value.credentialsKey;
  }

  get configuration(): Record<string, string> {
    return { ...this.value.configuration };
  }

  get connectedAt(): Date | null {
    return this.value.connectedAt;
  }

  get lastHealthCheckAt(): Date | null {
    return this.value.lastHealthCheckAt;
  }

  get lastSynchronizationAt(): Date | null {
    return this.value.lastSynchronizationAt;
  }

  get errorMessage(): string | null {
    return this.value.errorMessage;
  }

  get createdAt(): Date {
    return this.value.createdAt;
  }

  get updatedAt(): Date {
    return this.value.updatedAt;
  }

  isConnected(): boolean {
    return this.value.status === PosConnectionStatus.Connected;
  }

  canTransitionTo(target: PosConnectionStatus): boolean {
    const allowed = POS_CONNECTION_TRANSITIONS[this.value.status];
    return allowed.includes(target);
  }

  transitionTo(
    target: PosConnectionStatus,
    errorMessage?: string,
  ): PosConnection {
    if (!this.canTransitionTo(target)) {
      throw new Error(
        `Cannot transition from ${this.value.status} to ${target}`,
      );
    }

    const now = new Date();
    const updates: Partial<PosConnectionConfig> = {
      status: target,
      updatedAt: now,
      errorMessage: errorMessage ?? null,
    };

    if (target === PosConnectionStatus.Connected) {
      updates.connectedAt = now;
    }

    return PosConnection.reconstitute({ ...this.value, ...updates });
  }

  markHealthChecked(): PosConnection {
    return PosConnection.reconstitute({
      ...this.value,
      lastHealthCheckAt: new Date(),
      updatedAt: new Date(),
    });
  }

  markSynchronized(): PosConnection {
    return PosConnection.reconstitute({
      ...this.value,
      lastSynchronizationAt: new Date(),
      updatedAt: new Date(),
    });
  }

  updateConfiguration(config: Record<string, string>): PosConnection {
    return PosConnection.reconstitute({
      ...this.value,
      configuration: { ...config },
      updatedAt: new Date(),
    });
  }
}
