import type { RefundType } from "../../domain/models/RefundRequest.js";

export interface CreateRefundRequestDto {
  transactionId: string;
  amount: number;
  type: RefundType;
  reason?: string;
  requestedBy: string;
  requiresApproval?: boolean;
  metadata: Record<string, string>;
}

export interface RefundRequestResponseDto {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  reason: string | null;
  requestedBy: string;
  approvedBy: string | null;
  requiresApproval: boolean;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}
