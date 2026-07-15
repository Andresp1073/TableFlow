import { describe, it, expect, vi } from "vitest";
import { RefundManager } from "../application/services/RefundManager.js";
import { InMemoryPaymentTransactionRepository } from "../infrastructure/repositories/InMemoryPaymentRepositories.js";
import { PaymentTransaction, PaymentTransactionStatus } from "../domain/models/PaymentTransaction.js";
import { PaymentPolicy } from "../domain/models/PaymentPolicy.js";
import { BasePaymentAdapter } from "../infrastructure/adapters/PaymentAdapter.js";
import type { PaymentTransaction as PaymentTransactionType } from "../domain/models/PaymentTransaction.js";
import type { PaymentResult } from "../domain/models/PaymentResult.js";
import { PaymentResultStatus } from "../domain/models/PaymentResult.js";

class MockAdapter extends BasePaymentAdapter {
  readonly providerId = "stripe";
  readonly providerName = "Stripe";

  async createPayment(t: PaymentTransactionType): Promise<PaymentResult> {
    return this.createSuccessResult(t, `stripe_${t.id}`);
  }
  async authorize(t: PaymentTransactionType): Promise<PaymentResult> {
    return this.createSuccessResult(t, `stripe_${t.id}`, "auth_code");
  }
  async capture(t: PaymentTransactionType): Promise<PaymentResult> {
    return this.createSuccessResult(t, `stripe_${t.id}`);
  }
  async cancel(t: PaymentTransactionType): Promise<PaymentResult> {
    return this.createSuccessResult(t, `stripe_${t.id}`);
  }
  async refund(t: PaymentTransactionType): Promise<PaymentResult> {
    return this.createSuccessResult(t, `stripe_ref_${t.id}`);
  }
  async verifyStatus(t: PaymentTransactionType): Promise<any> {
    return { status: t.status, providerReference: t.providerReference };
  }
}

function createCapturedTransaction(): PaymentTransaction {
  const tx = PaymentTransaction.create({
    id: "tx-refund-test",
    intentId: "intent-1",
    providerId: "stripe",
    restaurantId: "rest-1",
    amount: 5000,
    currency: "USD",
    methodType: "credit_card",
    metadata: {},
  });
  const pending = tx.transitionTo(PaymentTransactionStatus.Pending);
  const authorized = pending.transitionTo(PaymentTransactionStatus.Authorized, {
    providerReference: "ref-1",
    authorizationCode: "auth-1",
  });
  return authorized.transitionTo(PaymentTransactionStatus.Captured);
}

describe("RefundManager", () => {
  it("creates a refund request", async () => {
    const repo = new InMemoryPaymentTransactionRepository();
    const eventPublisher = { publish: vi.fn() };
    const manager = new RefundManager(repo, eventPublisher);
    const tx = createCapturedTransaction();
    await repo.save(tx);

    const refund = await manager.createRefund(tx, 2000, "partial", "user-1", "Customer requested");
    expect(refund.amount).toBe(2000);
    expect(refund.type).toBe("partial");
    expect(refund.requiresApproval).toBe(false);
    expect(eventPublisher.publish).toHaveBeenCalledWith("RefundCreated", expect.any(Object));
  });

  it("creates a refund with approval required via policy", async () => {
    const repo = new InMemoryPaymentTransactionRepository();
    const eventPublisher = { publish: vi.fn() };
    const manager = new RefundManager(repo, eventPublisher);
    const tx = createCapturedTransaction();
    await repo.save(tx);

    const refundPolicy = PaymentPolicy.createRefundPolicy("ref-policy", 3000, 180);

    const refund = await manager.createRefund(
      tx, 5000, "full", "user-1", "Full refund",
      [refundPolicy],
      {},
    );
    expect(refund.requiresApproval).toBe(true);
    expect(refund.status).toBe("pending");
  });

  it("processes an auto-approved refund without approval step", async () => {
    const repo = new InMemoryPaymentTransactionRepository();
    const eventPublisher = { publish: vi.fn() };
    const manager = new RefundManager(repo, eventPublisher);
    manager.registerAdapter("stripe", new MockAdapter());
    const tx = createCapturedTransaction();
    await repo.save(tx);

    const refund = await manager.createRefund(tx, 2000, "partial", "user-1");
    expect(refund.requiresApproval).toBe(false);
    expect(refund.status).toBe("approved");

    const result = await manager.processRefund(refund, tx);
    expect(result.refund.status).toBe("completed");
    expect(result.transaction.refundedAmount).toBe(2000);
    expect(eventPublisher.publish).toHaveBeenCalledWith("RefundCompleted", expect.any(Object));
  });

  it("processes an approved refund", async () => {
    const repo = new InMemoryPaymentTransactionRepository();
    const eventPublisher = { publish: vi.fn() };
    const manager = new RefundManager(repo, eventPublisher);
    manager.registerAdapter("stripe", new MockAdapter());
    const tx = createCapturedTransaction();
    await repo.save(tx);

    const refundPolicy = PaymentPolicy.createRefundPolicy("ref-policy", 3000, 180);
    const refund = await manager.createRefund(
      tx, 5000, "full", "user-1", "Full refund",
      [refundPolicy],
      {},
    );

    const approved = await manager.approveRefund(refund, "admin-1");
    expect(approved.approvedBy).toBe("admin-1");
    expect(approved.status).toBe("approved");

    const result = await manager.processRefund(approved, tx);
    expect(result.refund.status).toBe("completed");
    expect(result.transaction.refundedAmount).toBe(5000);
    expect(eventPublisher.publish).toHaveBeenCalledWith("RefundCompleted", expect.any(Object));
  });

  it("rejects a refund", async () => {
    const repo = new InMemoryPaymentTransactionRepository();
    const eventPublisher = { publish: vi.fn() };
    const manager = new RefundManager(repo, eventPublisher);
    const tx = createCapturedTransaction();
    await repo.save(tx);

    const refundPolicy = PaymentPolicy.createRefundPolicy("ref-policy", 3000, 180);
    const refund = await manager.createRefund(
      tx, 5000, "full", "user-1", "Refund",
      [refundPolicy],
      {},
    );

    const rejected = await manager.rejectRefund(refund, "admin-1", "Policy violation");
    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectionReason).toBe("Policy violation");
  });
});
