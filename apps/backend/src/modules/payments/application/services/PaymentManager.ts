import type { PaymentTransactionRepository } from "../../domain/repositories/PaymentTransactionRepository.js";
import type { PaymentProviderRepository } from "../../domain/repositories/PaymentProviderRepository.js";
import { PaymentTransaction } from "../../domain/models/PaymentTransaction.js";
import { PaymentTransactionStatus } from "../../domain/models/PaymentTransaction.js";
import type { PaymentIntent } from "../../domain/models/PaymentIntent.js";
import type { PaymentResult } from "../../domain/models/PaymentResult.js";
import { PaymentResultStatus } from "../../domain/models/PaymentResult.js";
import { PaymentLifecycleManager } from "../../domain/services/PaymentLifecycleManager.js";
import { PaymentFraudCheck } from "../../domain/services/PaymentFraudCheck.js";
import type { FraudCheckInput } from "../../domain/services/PaymentFraudCheck.js";
import type { PaymentAdapter } from "../../infrastructure/adapters/PaymentAdapter.js";
import type { EventPublisher } from "../ports/EventPublisher.js";

export class PaymentManager {
  private readonly lifecycleManager: PaymentLifecycleManager;
  private readonly fraudCheck: PaymentFraudCheck;
  private readonly adapters: Map<string, PaymentAdapter> = new Map();

  constructor(
    private readonly transactionRepository: PaymentTransactionRepository,
    private readonly providerRepository: PaymentProviderRepository,
    private readonly eventPublisher: EventPublisher,
  ) {
    this.lifecycleManager = new PaymentLifecycleManager();
    this.fraudCheck = new PaymentFraudCheck();
  }

  registerAdapter(providerId: string, adapter: PaymentAdapter): void {
    this.adapters.set(providerId, adapter);
  }

  unregisterAdapter(providerId: string): void {
    this.adapters.delete(providerId);
  }

  getFraudCheck(): PaymentFraudCheck {
    return this.fraudCheck;
  }

  async createTransaction(
    intent: PaymentIntent,
    providerId: string,
    methodType: string,
  ): Promise<PaymentTransaction> {
    const provider = await this.providerRepository.findById(providerId);
    if (!provider || !provider.isAvailable()) {
      throw new Error(`Provider not available: ${providerId}`);
    }

    const transaction = PaymentTransaction.create({
      id: crypto.randomUUID(),
      intentId: intent.id,
      providerId,
      restaurantId: intent.restaurantId,
      reservationId: intent.reservationId,
      customerId: intent.customerId,
      amount: intent.amount,
      currency: intent.currency,
      methodType,
      providerReference: null,
      authorizationCode: null,
      capturedAmount: null,
      errorMessage: null,
      metadata: { ...intent.metadata },
      authorizedAt: null,
      capturedAt: null,
      expiresAt: intent.expiresAt,
    });

    const pending = transaction.transitionTo(PaymentTransactionStatus.Pending);

    const fraudInput: FraudCheckInput = {
      amount: intent.amount,
      currency: intent.currency,
      customerId: intent.customerId,
      customerEmail: intent.customerEmail,
      restaurantId: intent.restaurantId,
      methodType,
      metadata: intent.metadata,
    };

    const fraudResult = await this.fraudCheck.evaluate(fraudInput);

    if (fraudResult.riskLevel === "critical") {
      const failed = pending.transitionTo(
        PaymentTransactionStatus.Failed,
        { errorMessage: "Blocked by fraud detection" },
      );
      await this.transactionRepository.save(failed);
      this.eventPublisher.publish("PaymentFailed", {
        transactionId: failed.id,
        intentId: intent.id,
        providerId,
        restaurantId: intent.restaurantId,
        amount: intent.amount,
        currency: intent.currency,
        errorMessage: "Blocked by fraud detection",
        errorCode: "fraud_blocked",
      });
      return failed;
    }

    await this.transactionRepository.save(pending);
    this.eventPublisher.publish("PaymentCreated", {
      transactionId: pending.id,
      intentId: intent.id,
      providerId,
      restaurantId: intent.restaurantId,
      amount: intent.amount,
      currency: intent.currency,
      methodType,
    });

    return pending;
  }

  async authorize(
    transaction: PaymentTransaction,
  ): Promise<PaymentTransaction> {
    const validation = this.lifecycleManager.validateAuthorization(transaction);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    const adapter = this.adapters.get(transaction.providerId);
    if (!adapter) {
      throw new Error(`No adapter found for provider: ${transaction.providerId}`);
    }

    const result = await adapter.authorize(transaction);

    if (result.status === PaymentResultStatus.Success) {
      const authorized = transaction.transitionTo(PaymentTransactionStatus.Authorized, {
        providerReference: result.providerReference,
        authorizationCode: result.authorizationCode,
      });
      await this.transactionRepository.save(authorized);
      this.eventPublisher.publish("PaymentAuthorized", {
        transactionId: authorized.id,
        intentId: authorized.intentId,
        providerId: authorized.providerId,
        amount: authorized.amount,
        currency: authorized.currency,
        authorizationCode: authorized.authorizationCode ?? "",
        providerReference: authorized.providerReference ?? "",
      });
      return authorized;
    }

    if (result.status === PaymentResultStatus.Failure) {
      const failed = transaction.transitionTo(PaymentTransactionStatus.Failed, {
        errorMessage: result.errorMessage ?? "Authorization failed",
        providerReference: result.providerReference,
      });
      await this.transactionRepository.save(failed);
      this.eventPublisher.publish("PaymentFailed", {
        transactionId: failed.id,
        intentId: failed.intentId,
        providerId: failed.providerId,
        restaurantId: failed.restaurantId,
        amount: failed.amount,
        currency: failed.currency,
        errorMessage: result.errorMessage ?? "Authorization failed",
        errorCode: result.errorCode,
      });
      return failed;
    }

    return transaction;
  }

  async capture(
    transaction: PaymentTransaction,
    captureAmount?: number,
  ): Promise<PaymentTransaction> {
    const validation = this.lifecycleManager.validateCapture(transaction, captureAmount);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    const adapter = this.adapters.get(transaction.providerId);
    if (!adapter) {
      throw new Error(`No adapter found for provider: ${transaction.providerId}`);
    }

    const result = await adapter.capture(transaction, captureAmount);

    if (result.status === PaymentResultStatus.Success) {
      const captured = transaction.transitionTo(PaymentTransactionStatus.Captured, {
        providerReference: result.providerReference,
        capturedAmount: captureAmount ?? transaction.amount,
      });
      await this.transactionRepository.save(captured);
      this.eventPublisher.publish("PaymentCaptured", {
        transactionId: captured.id,
        intentId: captured.intentId,
        providerId: captured.providerId,
        amount: captured.amount,
        capturedAmount: captured.capturedAmount ?? captured.amount,
        currency: captured.currency,
        providerReference: captured.providerReference ?? "",
      });
      return captured;
    }

    if (result.status === PaymentResultStatus.Failure) {
      const failed = transaction.transitionTo(PaymentTransactionStatus.Failed, {
        errorMessage: result.errorMessage ?? "Capture failed",
      });
      await this.transactionRepository.save(failed);
      this.eventPublisher.publish("PaymentFailed", {
        transactionId: failed.id,
        intentId: failed.intentId,
        providerId: failed.providerId,
        restaurantId: failed.restaurantId,
        amount: failed.amount,
        currency: failed.currency,
        errorMessage: result.errorMessage ?? "Capture failed",
        errorCode: result.errorCode,
      });
      return failed;
    }

    return transaction;
  }

  async cancel(transaction: PaymentTransaction, reason?: string): Promise<PaymentTransaction> {
    if (!transaction.canTransitionTo(PaymentTransactionStatus.Cancelled)) {
      throw new Error(`Cannot cancel transaction in status: ${transaction.status}`);
    }

    const adapter = this.adapters.get(transaction.providerId);
    if (adapter) {
      try {
        await adapter.cancel(transaction);
      } catch {
        // Log but proceed with local cancellation
      }
    }

    const cancelled = transaction.transitionTo(PaymentTransactionStatus.Cancelled, {
      errorMessage: reason ?? null,
    });
    await this.transactionRepository.save(cancelled);
    this.eventPublisher.publish("PaymentCancelled", {
      transactionId: cancelled.id,
      intentId: cancelled.intentId,
      providerId: cancelled.providerId,
      restaurantId: cancelled.restaurantId,
      reason: reason ?? null,
    });

    return cancelled;
  }

  async verifyStatus(transaction: PaymentTransaction): Promise<PaymentTransaction> {
    const adapter = this.adapters.get(transaction.providerId);
    if (!adapter) {
      return transaction;
    }

    try {
      const result = await adapter.verifyStatus(transaction);
      if (result.status !== transaction.status) {
        // Status changed externally, update local state
        const updated = PaymentTransaction.reconstitute({
          ...transaction.value,
          status: result.status as unknown as PaymentTransactionStatus,
          updatedAt: new Date(),
        });
        await this.transactionRepository.save(updated);
        return updated;
      }
    } catch {
      // Adapter verification failed, return current state
    }

    return transaction;
  }
}
