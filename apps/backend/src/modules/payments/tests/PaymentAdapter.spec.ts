import { describe, it, expect } from "vitest";
import { StripeProvider } from "../infrastructure/providers/StripeProvider.js";
import { AdyenProvider } from "../infrastructure/providers/AdyenProvider.js";
import { MercadoPagoProvider } from "../infrastructure/providers/MercadoPagoProvider.js";
import { SquarePaymentsProvider } from "../infrastructure/providers/SquarePaymentsProvider.js";
import { PayPalProvider } from "../infrastructure/providers/PayPalProvider.js";
import { BankProvider } from "../infrastructure/providers/BankProvider.js";
import { PaymentTransaction, PaymentTransactionStatus } from "../domain/models/PaymentTransaction.js";
import { PaymentResultStatus } from "../domain/models/PaymentResult.js";

function createTestTransaction(): PaymentTransaction {
  return PaymentTransaction.reconstitute({
    id: "tx-adapter-test",
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
  });
}

describe("PaymentAdapters", () => {
  const adapters = [
    new StripeProvider(),
    new AdyenProvider(),
    new MercadoPagoProvider(),
    new SquarePaymentsProvider(),
    new PayPalProvider(),
    new BankProvider(),
  ];

  const tx = createTestTransaction();

  for (const adapter of adapters) {
    describe(`${adapter.providerName}`, () => {
      it("has correct provider ID", () => {
        expect(adapter.providerId).toBeTruthy();
        expect(adapter.providerName).toBeTruthy();
      });

      it("authorizes payment", async () => {
        const result = await adapter.authorize(tx);
        expect([PaymentResultStatus.Success, PaymentResultStatus.Pending]).toContain(result.status);
        expect(result.providerReference).toBeTruthy();
      });

      it("captures payment", async () => {
        const result = await adapter.capture(tx);
        expect([PaymentResultStatus.Success, PaymentResultStatus.Pending]).toContain(result.status);
      });

      it("cancels payment", async () => {
        const result = await adapter.cancel(tx);
        expect([PaymentResultStatus.Success, PaymentResultStatus.Pending]).toContain(result.status);
      });

      it("refunds payment", async () => {
        const result = await adapter.refund(tx, 2500);
        expect([PaymentResultStatus.Success, PaymentResultStatus.Pending]).toContain(result.status);
      });

      it("verifies status", async () => {
        const result = await adapter.verifyStatus(tx);
        expect(result.status).toBe(tx.status);
      });

      it("creates payment", async () => {
        const result = await adapter.createPayment(tx);
        expect([PaymentResultStatus.Success, PaymentResultStatus.Pending]).toContain(result.status);
      });
    });
  }
});
