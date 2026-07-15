import { describe, it, expect } from "vitest";
import { PaymentMethod, PaymentMethodType } from "../domain/models/PaymentMethod.js";

describe("PaymentMethod", () => {
  it("creates a payment method", () => {
    const method = PaymentMethod.create({
      id: "credit_card",
      type: PaymentMethodType.CreditCard,
      displayName: "Credit Card",
      providerId: "stripe",
      isEnabled: true,
      requiresTokenization: true,
      processingTimeMs: 2000,
    });
    expect(method.type).toBe(PaymentMethodType.CreditCard);
    expect(method.isCard()).toBe(true);
    expect(method.isDigital()).toBe(false);
  });

  it("identifies card methods", () => {
    const credit = PaymentMethod.create({
      id: "cc", type: PaymentMethodType.CreditCard, displayName: "CC", providerId: "p1", isEnabled: true, requiresTokenization: true, processingTimeMs: 1000,
    });
    const debit = PaymentMethod.create({
      id: "dc", type: PaymentMethodType.DebitCard, displayName: "DC", providerId: "p1", isEnabled: true, requiresTokenization: true, processingTimeMs: 1000,
    });
    const wallet = PaymentMethod.create({
      id: "pp", type: PaymentMethodType.DigitalWallet, displayName: "PP", providerId: "p1", isEnabled: true, requiresTokenization: true, processingTimeMs: 1000,
    });
    expect(credit.isCard()).toBe(true);
    expect(debit.isCard()).toBe(true);
    expect(wallet.isCard()).toBe(false);
    expect(wallet.isDigital()).toBe(true);
  });

  it("enables and disables", () => {
    const method = PaymentMethod.create({
      id: "gc", type: PaymentMethodType.GiftCard, displayName: "Gift Card", providerId: "p1", isEnabled: false, requiresTokenization: false, processingTimeMs: 500,
    });
    expect(method.isEnabled).toBe(false);
    expect(method.enable().isEnabled).toBe(true);
    expect(method.disable().isEnabled).toBe(false);
  });
});
