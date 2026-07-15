import { describe, it, expect, vi } from "vitest";
import { PaymentManager } from "../application/services/PaymentManager.js";
import { PaymentProviderService } from "../application/services/PaymentProviderService.js";
import { RefundManager } from "../application/services/RefundManager.js";
import {
  InMemoryPaymentTransactionRepository,
  InMemoryPaymentProviderRepository,
} from "../infrastructure/repositories/InMemoryPaymentRepositories.js";
import { StripeProvider } from "../infrastructure/providers/StripeProvider.js";
import { AdyenProvider } from "../infrastructure/providers/AdyenProvider.js";
import { PaymentProviderStatus } from "../domain/models/PaymentProvider.js";
import { PaymentProvider } from "../domain/models/PaymentProvider.js";
import { PaymentIntent } from "../domain/models/PaymentIntent.js";
import { PaymentTransactionStatus } from "../domain/models/PaymentTransaction.js";

describe("Payment Integration", () => {
  it("processes a complete payment lifecycle", async () => {
    const eventPublisher = { publish: vi.fn() };
    const txRepo = new InMemoryPaymentTransactionRepository();
    const providerRepo = new InMemoryPaymentProviderRepository();

    const manager = new PaymentManager(txRepo, providerRepo, eventPublisher);
    const providerService = new PaymentProviderService(providerRepo);
    const refundManager = new RefundManager(txRepo, eventPublisher);

    const stripeAdapter = new StripeProvider();
    manager.registerAdapter("stripe", stripeAdapter);
    refundManager.registerAdapter("stripe", stripeAdapter);

    await providerService.registerProvider({
      id: "stripe",
      name: "stripe",
      displayName: "Stripe",
      supportedFeatures: ["create_payment", "authorize_payment", "capture_payment", "cancel_payment", "refund_payment", "verify_status"],
      supportedMethods: ["credit_card", "debit_card"],
      priority: 100,
    });

    const stripeProvider = await providerRepo.findById("stripe");
    expect(stripeProvider?.isAvailable()).toBe(true);

    const intent = PaymentIntent.create({
      id: "intent-int-1",
      amount: 10000,
      currency: "USD",
      reference: "REF-INT-001",
      restaurantId: "rest-1",
      allowedMethods: ["credit_card"],
      metadata: {},
      expiresAt: null,
    });

    const transaction = await manager.createTransaction(intent, "stripe", "credit_card");
    expect(transaction.status).toBe(PaymentTransactionStatus.Pending);

    const authorized = await manager.authorize(transaction);
    expect(authorized.status).toBe(PaymentTransactionStatus.Authorized);
    expect(authorized.authorizationCode).toBeTruthy();

    const captured = await manager.capture(authorized);
    expect(captured.status).toBe(PaymentTransactionStatus.Captured);
    expect(captured.capturedAmount).toBe(10000);

    const refund = await refundManager.createRefund(captured, 5000, "partial", "user-1", "Customer dispute");
    const result = await refundManager.processRefund(refund, captured);
    expect(result.transaction.refundedAmount).toBe(5000);
    expect(result.transaction.status).toBe(PaymentTransactionStatus.Captured);

    const fullRefund = await refundManager.createRefund(result.transaction, 5000, "partial", "user-1", "Remaining");
    const fullResult = await refundManager.processRefund(fullRefund, result.transaction);
    expect(fullResult.transaction.refundedAmount).toBe(10000);
    expect(fullResult.transaction.status).toBe(PaymentTransactionStatus.Refunded);
  });

  it("handles failed authorization", async () => {
    const eventPublisher = { publish: vi.fn() };
    const txRepo = new InMemoryPaymentTransactionRepository();
    const providerRepo = new InMemoryPaymentProviderRepository();

    class FailingStripe extends StripeProvider {
      async authorize() {
        return this.createFailureResult(
          { id: "tx", amount: 5000, currency: "USD" } as any,
          "Card declined",
          "card_declined",
        );
      }
    }

    const manager = new PaymentManager(txRepo, providerRepo, eventPublisher);
    manager.registerAdapter("stripe", new FailingStripe());

    await providerRepo.save(PaymentProvider.create({
      id: "stripe",
      name: "stripe",
      displayName: "Stripe",
      status: PaymentProviderStatus.Active,
      supportedFeatures: ["authorize_payment"],
      supportedMethods: ["credit_card"],
      isEnabled: true,
      priority: 100,
    }));

    const intent = PaymentIntent.create({
      id: "intent-fail-1",
      amount: 5000,
      currency: "USD",
      reference: "REF-FAIL-001",
      restaurantId: "rest-1",
      allowedMethods: ["credit_card"],
      metadata: {},
      expiresAt: null,
    });

    const tx = await manager.createTransaction(intent, "stripe", "credit_card");
    const result = await manager.authorize(tx);
    expect(result.status).toBe(PaymentTransactionStatus.Failed);
  });
});
