import { PaymentTransactionStatus } from "../models/PaymentTransaction.js";
import type { PaymentTransaction } from "../models/PaymentTransaction.js";

export interface LifecycleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class PaymentLifecycleManager {
  validateTransition(
    transaction: PaymentTransaction,
    target: PaymentTransactionStatus,
  ): LifecycleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!transaction.canTransitionTo(target)) {
      errors.push(
        `Cannot transition from ${transaction.status} to ${target}`,
      );
    }

    if (target === PaymentTransactionStatus.Captured && !transaction.authorizationCode) {
      warnings.push("Capturing without prior authorization");
    }

    if (target === PaymentTransactionStatus.Refunded) {
      if (transaction.status !== PaymentTransactionStatus.Captured) {
        errors.push("Can only refund a captured transaction");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateAuthorization(transaction: PaymentTransaction): LifecycleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (transaction.amount <= 0) {
      errors.push("Cannot authorize a zero or negative amount");
    }

    if (transaction.expiresAt && transaction.isExpired()) {
      errors.push("Transaction has expired");
    }

    if (transaction.status !== PaymentTransactionStatus.Pending) {
      errors.push(`Cannot authorize in status: ${transaction.status}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateCapture(transaction: PaymentTransaction, captureAmount?: number): LifecycleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (transaction.status !== PaymentTransactionStatus.Authorized) {
      errors.push(`Cannot capture in status: ${transaction.status}`);
    }

    if (captureAmount !== undefined) {
      if (captureAmount <= 0) {
        errors.push("Capture amount must be positive");
      }
      if (captureAmount > transaction.amount) {
        errors.push("Capture amount cannot exceed authorized amount");
      }
      if (captureAmount < transaction.amount) {
        warnings.push("Partial capture will be performed");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateRefund(transaction: PaymentTransaction, refundAmount: number): LifecycleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (transaction.status !== PaymentTransactionStatus.Captured) {
      errors.push(`Cannot refund in status: ${transaction.status}`);
    }

    if (refundAmount <= 0) {
      errors.push("Refund amount must be positive");
    }

    if (refundAmount > transaction.getRemainingRefundableAmount()) {
      errors.push("Refund amount exceeds remaining refundable amount");
    }

    if (refundAmount < transaction.amount) {
      warnings.push("Partial refund will be performed");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
