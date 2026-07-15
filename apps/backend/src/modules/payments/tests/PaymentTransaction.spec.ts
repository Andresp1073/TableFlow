import { describe, it, expect } from "vitest";
import { PaymentTransaction, PaymentTransactionStatus } from "../domain/models/PaymentTransaction.js";

function createTransaction(overrides?: Record<string, unknown>): PaymentTransaction {
  const base: any = {
    id: "tx-1",
    intentId: "intent-1",
    providerId: "stripe",
    restaurantId: "rest-1",
    amount: 5000,
    currency: "USD",
    methodType: "credit_card",
    metadata: {},
    ...overrides,
  };
  return PaymentTransaction.create(base);
}

describe("PaymentTransaction", () => {
  it("creates transaction in Created status", () => {
    const tx = createTransaction();
    expect(tx.status).toBe(PaymentTransactionStatus.Created);
  });

  it("transitions to pending", () => {
    const tx = createTransaction();
    const pending = tx.transitionTo(PaymentTransactionStatus.Pending);
    expect(pending.status).toBe(PaymentTransactionStatus.Pending);
  });

  it("rejects invalid transition", () => {
    const tx = createTransaction();
    expect(() => tx.transitionTo(PaymentTransactionStatus.Captured)).toThrow(
      "Cannot transition from created to captured",
    );
  });

  it("transitions through full lifecycle", () => {
    const tx = createTransaction();
    const pending = tx.transitionTo(PaymentTransactionStatus.Pending);
    const authorized = pending.transitionTo(PaymentTransactionStatus.Authorized, {
      providerReference: "ref-123",
      authorizationCode: "auth-456",
    });
    expect(authorized.status).toBe(PaymentTransactionStatus.Authorized);
    expect(authorized.authorizationCode).toBe("auth-456");
    expect(authorized.authorizedAt).toBeInstanceOf(Date);

    const captured = authorized.transitionTo(PaymentTransactionStatus.Captured);
    expect(captured.status).toBe(PaymentTransactionStatus.Captured);
    expect(captured.capturedAmount).toBe(5000);
    expect(captured.capturedAt).toBeInstanceOf(Date);
  });

  it("handles partial refunds", () => {
    const tx = createTransaction();
    const pending = tx.transitionTo(PaymentTransactionStatus.Pending);
    const authorized = pending.transitionTo(PaymentTransactionStatus.Authorized, {
      providerReference: "ref-1",
      authorizationCode: "auth-1",
    });
    const captured = authorized.transitionTo(PaymentTransactionStatus.Captured);

    const refund1 = captured.addRefund({
      id: "refund-1",
      amount: 2000,
      currency: "USD",
      reason: "Partial refund",
      type: "partial",
      approvedBy: "user-1",
      providerReference: "refund-ref-1",
      createdAt: new Date(),
    });
    expect(refund1.refundedAmount).toBe(2000);
    expect(refund1.status).toBe(PaymentTransactionStatus.Captured);

    const refund2 = refund1.addRefund({
      id: "refund-2",
      amount: 3000,
      currency: "USD",
      reason: "Final refund",
      type: "partial",
      approvedBy: "user-1",
      providerReference: "refund-ref-2",
      createdAt: new Date(),
    });
    expect(refund2.refundedAmount).toBe(5000);
    expect(refund2.status).toBe(PaymentTransactionStatus.Refunded);
    expect(refund2.isFullyRefunded()).toBe(true);
  });

  it("prevents over-refunding", () => {
    const tx = createTransaction();
    const pending = tx.transitionTo(PaymentTransactionStatus.Pending);
    const authorized = pending.transitionTo(PaymentTransactionStatus.Authorized, {
      providerReference: "ref-1",
      authorizationCode: "auth-1",
    });
    const captured = authorized.transitionTo(PaymentTransactionStatus.Captured);
    const refunded = captured.addRefund({
      id: "refund-1",
      amount: 5000,
      currency: "USD",
      reason: "Full refund",
      type: "full",
      approvedBy: "user-1",
      providerReference: "refund-ref-1",
      createdAt: new Date(),
    });

    expect(() =>
      refunded.addRefund({
        id: "refund-2",
        amount: 1000,
        currency: "USD",
        reason: "Extra refund",
        type: "partial",
        approvedBy: "user-1",
        providerReference: "refund-ref-2",
        createdAt: new Date(),
      }),
    ).toThrow("Refund amount exceeds transaction amount");
  });

  it("calculates remaining refundable amount", () => {
    const tx = createTransaction();
    const pending = tx.transitionTo(PaymentTransactionStatus.Pending);
    const authorized = pending.transitionTo(PaymentTransactionStatus.Authorized, {
      providerReference: "ref-1",
      authorizationCode: "auth-1",
    });
    const captured = authorized.transitionTo(PaymentTransactionStatus.Captured);
    expect(captured.getRemainingRefundableAmount()).toBe(5000);

    const refunded = captured.addRefund({
      id: "refund-1",
      amount: 2000,
      currency: "USD",
      reason: "Partial",
      type: "partial",
      approvedBy: "user-1",
      providerReference: "refund-ref-1",
      createdAt: new Date(),
    });
    expect(refunded.getRemainingRefundableAmount()).toBe(3000);
  });
});
