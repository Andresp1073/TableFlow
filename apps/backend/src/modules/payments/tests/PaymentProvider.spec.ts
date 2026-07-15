import { describe, it, expect } from "vitest";
import { PaymentProvider, PaymentProviderStatus } from "../domain/models/PaymentProvider.js";

describe("PaymentProvider", () => {
  it("creates a payment provider", () => {
    const provider = PaymentProvider.create({
      id: "stripe",
      name: "stripe",
      displayName: "Stripe",
      status: PaymentProviderStatus.Active,
      supportedFeatures: ["create_payment", "authorize_payment", "capture_payment"],
      supportedMethods: ["credit_card", "debit_card"],
      isEnabled: true,
      priority: 100,
    });
    expect(provider.id).toBe("stripe");
    expect(provider.name).toBe("stripe");
    expect(provider.isAvailable()).toBe(true);
  });

  it("checks feature support", () => {
    const provider = PaymentProvider.create({
      id: "stripe",
      name: "stripe",
      displayName: "Stripe",
      status: PaymentProviderStatus.Active,
      supportedFeatures: ["create_payment", "authorize_payment"],
      supportedMethods: [],
      isEnabled: true,
      priority: 100,
    });
    expect(provider.supportsFeature("create_payment")).toBe(true);
    expect(provider.supportsFeature("refund_payment")).toBe(false);
  });

  it("deactivates provider", () => {
    const provider = PaymentProvider.create({
      id: "stripe",
      name: "stripe",
      displayName: "Stripe",
      status: PaymentProviderStatus.Active,
      supportedFeatures: [],
      supportedMethods: [],
      isEnabled: true,
      priority: 100,
    });
    const deactivated = provider.deactivate();
    expect(deactivated.status).toBe(PaymentProviderStatus.Inactive);
  });

  it("marks as degraded", () => {
    const provider = PaymentProvider.create({
      id: "stripe",
      name: "stripe",
      displayName: "Stripe",
      status: PaymentProviderStatus.Active,
      supportedFeatures: [],
      supportedMethods: [],
      isEnabled: true,
      priority: 100,
    });
    const degraded = provider.markDegraded();
    expect(degraded.status).toBe(PaymentProviderStatus.Degraded);
  });
});
