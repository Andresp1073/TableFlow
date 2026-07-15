import { describe, it, expect } from "vitest";
import { PaymentTransaction, PaymentTransactionStatus } from "../domain/models/PaymentTransaction.js";
import { PaymentLifecycleManager } from "../domain/services/PaymentLifecycleManager.js";

function createTestTransaction(overrides?: Partial<PaymentTransactionConfig>): PaymentTransaction {
  const config: PaymentTransactionConfig = {
    id: "tx-1",
    intentId: "intent-1",
    providerId: "stripe",
    restaurantId: "rest-1",
    amount: 5000,
    currency: "USD",
    status: PaymentTransactionStatus.Pending,
    methodType: "credit_card",
    providerReference: null,
    authorizationCode: null,
    capturedAmount: null,
    refundedAmount: 0,
    refunds: [],
    errorMessage: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    authorizedAt: null,
    capturedAt: null,
    expiresAt: null,
    ...overrides,
  };
  return PaymentTransaction.reconstitute(config);
}

import type { PaymentTransactionConfig } from "../domain/models/PaymentTransaction.js";

describe("PaymentLifecycleManager", () => {
  const manager = new PaymentLifecycleManager();

  describe("validateTransition", () => {
    it("allows valid transition from pending to authorized", () => {
      const tx = createTestTransaction();
      const result = manager.validateTransition(tx, PaymentTransactionStatus.Authorized);
      expect(result.isValid).toBe(true);
    });

    it("rejects invalid transition from created to captured", () => {
      const tx = createTestTransaction({ status: PaymentTransactionStatus.Created });
      const result = manager.validateTransition(tx, PaymentTransactionStatus.Captured);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it("warns when capturing without authorization", () => {
      const tx = createTestTransaction({ status: PaymentTransactionStatus.Pending, authorizationCode: null });
      const result = manager.validateTransition(tx, PaymentTransactionStatus.Captured);
      expect(result.warnings).toContain("Capturing without prior authorization");
    });
  });

  describe("validateAuthorization", () => {
    it("validates zero amount", () => {
      const tx = createTestTransaction({ amount: 0 });
      const result = manager.validateAuthorization(tx);
      expect(result.isValid).toBe(false);
    });

    it("validates wrong status", () => {
      const tx = createTestTransaction({ status: PaymentTransactionStatus.Authorized });
      const result = manager.validateAuthorization(tx);
      expect(result.isValid).toBe(false);
    });
  });

  describe("validateCapture", () => {
    it("allows valid capture", () => {
      const tx = createTestTransaction({ status: PaymentTransactionStatus.Authorized });
      const result = manager.validateCapture(tx);
      expect(result.isValid).toBe(true);
    });

    it("rejects capture on pending transaction", () => {
      const tx = createTestTransaction({ status: PaymentTransactionStatus.Pending });
      const result = manager.validateCapture(tx);
      expect(result.isValid).toBe(false);
    });
  });

  describe("validateRefund", () => {
    it("allows valid refund", () => {
      const tx = createTestTransaction({
        status: PaymentTransactionStatus.Captured,
        capturedAmount: 5000,
      });
      const result = manager.validateRefund(tx, 2500);
      expect(result.isValid).toBe(true);
    });

    it("rejects refund exceeding remaining amount", () => {
      const tx = createTestTransaction({
        status: PaymentTransactionStatus.Captured,
        capturedAmount: 5000,
        refundedAmount: 4000,
      });
      const result = manager.validateRefund(tx, 2000);
      expect(result.isValid).toBe(false);
    });
  });
});
