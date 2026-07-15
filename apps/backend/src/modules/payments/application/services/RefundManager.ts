import type { PaymentTransactionRepository } from "../../domain/repositories/PaymentTransactionRepository.js";
import type { PaymentTransaction } from "../../domain/models/PaymentTransaction.js";
import { PaymentTransactionStatus } from "../../domain/models/PaymentTransaction.js";
import { RefundRequest, RefundRequestStatus } from "../../domain/models/RefundRequest.js";
import type { RefundType } from "../../domain/models/RefundRequest.js";
import type { PaymentPolicy } from "../../domain/models/PaymentPolicy.js";
import { PaymentLifecycleManager } from "../../domain/services/PaymentLifecycleManager.js";
import { RefundPolicyService } from "../../domain/services/RefundPolicyService.js";
import type { PaymentAdapter } from "../../infrastructure/adapters/PaymentAdapter.js";
import type { EventPublisher } from "../ports/EventPublisher.js";

export class RefundManager {
  private readonly lifecycleManager: PaymentLifecycleManager;
  private readonly refundPolicy: RefundPolicyService;
  private readonly adapters: Map<string, PaymentAdapter> = new Map();

  constructor(
    private readonly transactionRepository: PaymentTransactionRepository,
    private readonly eventPublisher: EventPublisher,
  ) {
    this.lifecycleManager = new PaymentLifecycleManager();
    this.refundPolicy = new RefundPolicyService();
  }

  registerAdapter(providerId: string, adapter: PaymentAdapter): void {
    this.adapters.set(providerId, adapter);
  }

  async createRefund(
    transaction: PaymentTransaction,
    amount: number,
    type: RefundType,
    requestedBy: string,
    reason?: string,
    refundPolicies?: PaymentPolicy[],
    metadata?: Record<string, string>,
  ): Promise<RefundRequest> {
    const validation = this.lifecycleManager.validateRefund(transaction, amount);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    const requiresApproval = refundPolicies
      ? this.refundPolicy.checkEligibility(transaction, amount, refundPolicies).requiresApproval
      : false;

    const refundRequest = RefundRequest.create({
      id: crypto.randomUUID(),
      transactionId: transaction.id,
      amount,
      currency: transaction.currency,
      type,
      reason: reason ?? null,
      requestedBy,
      requiresApproval,
      metadata: metadata ?? {},
    });

    this.eventPublisher.publish("RefundCreated", {
      refundId: refundRequest.id,
      transactionId: transaction.id,
      amount,
      currency: transaction.currency,
      type,
      reason: reason ?? null,
      requestedBy,
      requiresApproval,
    });

    return refundRequest;
  }

  async approveRefund(refundRequest: RefundRequest, approvedBy: string): Promise<RefundRequest> {
    if (!refundRequest.needsApproval()) {
      throw new Error("Refund does not require approval or is not in pending state");
    }

    return refundRequest.approve(approvedBy);
  }

  async rejectRefund(refundRequest: RefundRequest, rejectedBy: string, reason: string): Promise<RefundRequest> {
    if (!refundRequest.needsApproval()) {
      throw new Error("Refund does not require approval or is not in pending state");
    }

    return refundRequest.reject(rejectedBy, reason);
  }

  async processRefund(
    refundRequest: RefundRequest,
    transaction: PaymentTransaction,
  ): Promise<{ refund: RefundRequest; transaction: PaymentTransaction }> {
    if (refundRequest.status !== RefundRequestStatus.Approved && refundRequest.requiresApproval) {
      throw new Error("Refund has not been approved");
    }

    const processing = refundRequest.markProcessing();

    const adapter = this.adapters.get(transaction.providerId);
    if (!adapter) {
      const failed = processing.markFailed("No adapter found for provider");
      return { refund: failed, transaction };
    }

    try {
      const result = await adapter.refund(transaction, refundRequest.amount);

      if (result.isSuccess()) {
        const completed = processing.complete(result.providerReference);
        const refundEntry = {
          id: refundRequest.id,
          amount: refundRequest.amount,
          currency: refundRequest.currency,
          reason: refundRequest.reason,
          type: refundRequest.type,
          approvedBy: refundRequest.approvedBy,
          providerReference: result.providerReference,
          createdAt: new Date(),
        };
        const updatedTransaction = transaction.addRefund(refundEntry);

        await this.transactionRepository.save(updatedTransaction);

        this.eventPublisher.publish("RefundCompleted", {
          refundId: completed.id,
          transactionId: transaction.id,
          amount: refundRequest.amount,
          currency: refundRequest.currency,
          providerReference: result.providerReference,
        });

        return { refund: completed, transaction: updatedTransaction };
      }

      const failed = processing.markFailed(result.errorMessage ?? "Refund failed");
      return { refund: failed, transaction };
    } catch (error) {
      const failed = processing.markFailed(
        error instanceof Error ? error.message : "Refund processing error",
      );
      return { refund: failed, transaction };
    }
  }
}
