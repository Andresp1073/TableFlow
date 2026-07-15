import type { PointsTransaction } from "../../domain/models/PointsTransaction.js";

export type PointsTransactionDto = {
  id: string;
  accountId: string;
  type: string;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string;
  referenceType: string;
  description: string;
  expiresAt: string | null;
  performedBy: string;
  createdAt: string;
};

export function toPointsTransactionDto(tx: PointsTransaction): PointsTransactionDto {
  return {
    id: tx.id,
    accountId: tx.accountId,
    type: tx.type,
    points: tx.points,
    balanceBefore: tx.balanceBefore,
    balanceAfter: tx.balanceAfter,
    referenceId: tx.referenceId,
    referenceType: tx.referenceType,
    description: tx.description,
    expiresAt: tx.expiresAt?.toISOString() ?? null,
    performedBy: tx.performedBy,
    createdAt: tx.createdAt.toISOString(),
  };
}
