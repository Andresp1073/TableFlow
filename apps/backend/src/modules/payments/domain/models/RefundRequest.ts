export enum RefundRequestStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
}

export type RefundType = "full" | "partial";

export interface RefundRequestConfig {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  type: RefundType;
  reason: string | null;
  requestedBy: string;
  approvedBy: string | null;
  status: RefundRequestStatus;
  providerReference: string | null;
  requiresApproval: boolean;
  rejectionReason: string | null;
  metadata: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export class RefundRequest {
  private constructor(public readonly value: RefundRequestConfig) {}

  static create(config: Omit<RefundRequestConfig, "status" | "createdAt" | "updatedAt" | "completedAt" | "approvedBy" | "providerReference" | "rejectionReason">): RefundRequest {
    const now = new Date();

    if (config.amount <= 0) {
      throw new Error("Refund amount must be positive");
    }

    return new RefundRequest({
      ...config,
      status: config.requiresApproval ? RefundRequestStatus.Pending : RefundRequestStatus.Approved,
      approvedBy: config.requiresApproval ? null : config.requestedBy,
      providerReference: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });
  }

  static reconstitute(config: RefundRequestConfig): RefundRequest {
    return new RefundRequest(config);
  }

  equals(other: RefundRequest): boolean {
    return this.value.id === other.value.id;
  }

  get id(): string {
    return this.value.id;
  }

  get transactionId(): string {
    return this.value.transactionId;
  }

  get amount(): number {
    return this.value.amount;
  }

  get currency(): string {
    return this.value.currency;
  }

  get type(): RefundType {
    return this.value.type;
  }

  get reason(): string | null {
    return this.value.reason;
  }

  get requestedBy(): string {
    return this.value.requestedBy;
  }

  get approvedBy(): string | null {
    return this.value.approvedBy;
  }

  get status(): RefundRequestStatus {
    return this.value.status;
  }

  get providerReference(): string | null {
    return this.value.providerReference;
  }

  get requiresApproval(): boolean {
    return this.value.requiresApproval;
  }

  get rejectionReason(): string | null {
    return this.value.rejectionReason;
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

  get completedAt(): Date | null {
    return this.value.completedAt;
  }

  approve(approvedBy: string): RefundRequest {
    return RefundRequest.reconstitute({
      ...this.value,
      status: RefundRequestStatus.Approved,
      approvedBy,
      updatedAt: new Date(),
    });
  }

  reject(rejectedBy: string, reason: string): RefundRequest {
    return RefundRequest.reconstitute({
      ...this.value,
      status: RefundRequestStatus.Rejected,
      rejectionReason: reason,
      updatedAt: new Date(),
    });
  }

  markProcessing(): RefundRequest {
    return RefundRequest.reconstitute({
      ...this.value,
      status: RefundRequestStatus.Processing,
      updatedAt: new Date(),
    });
  }

  complete(providerReference: string): RefundRequest {
    return RefundRequest.reconstitute({
      ...this.value,
      status: RefundRequestStatus.Completed,
      providerReference,
      completedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  markFailed(errorMessage: string): RefundRequest {
    return RefundRequest.reconstitute({
      ...this.value,
      status: RefundRequestStatus.Failed,
      updatedAt: new Date(),
      metadata: { ...this.value.metadata, failureReason: errorMessage },
    });
  }

  isFullRefund(): boolean {
    return this.value.type === "full";
  }

  isPartialRefund(): boolean {
    return this.value.type === "partial";
  }

  needsApproval(): boolean {
    return this.value.status === RefundRequestStatus.Pending && this.value.requiresApproval;
  }
}
