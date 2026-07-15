import { describe, it, expect } from "vitest";
import { PaymentPolicy, PaymentPolicyType } from "../domain/models/PaymentPolicy.js";

describe("PaymentPolicy", () => {
  it("creates an authorization policy", () => {
    const policy = PaymentPolicy.createAuthorizationPolicy(
      "auth-policy-1",
      3600000,
      "cancel" as any,
    );
    expect(policy.type).toBe(PaymentPolicyType.Authorization);
    expect(policy.isEnabled).toBe(true);
    expect(policy.getRule("maxAuthorizationTimeMs", 0)).toBe(3600000);
  });

  it("creates a capture policy", () => {
    const policy = PaymentPolicy.createCapturePolicy("cap-policy-1", 5000, true);
    expect(policy.type).toBe(PaymentPolicyType.Capture);
    expect(policy.getRule("autoCapture", false)).toBe(true);
  });

  it("creates a refund policy", () => {
    const policy = PaymentPolicy.createRefundPolicy("ref-policy-1", 50000, 180);
    expect(policy.type).toBe(PaymentPolicyType.Refund);
    expect(policy.getRule("requireApprovalAbove", 0)).toBe(50000);
  });

  it("enables and disables", () => {
    const policy = PaymentPolicy.create({
      id: "policy-1",
      name: "Test Policy",
      type: PaymentPolicyType.Fraud,
      isEnabled: false,
      rules: {},
      priority: 100,
    });
    expect(policy.isEnabled).toBe(false);
    expect(policy.enable().isEnabled).toBe(true);
    expect(policy.disable().isEnabled).toBe(false);
  });

  it("gets rule with default", () => {
    const policy = PaymentPolicy.create({
      id: "policy-1",
      name: "Test",
      type: PaymentPolicyType.Authorization,
      isEnabled: true,
      rules: { timeout: 5000 },
      priority: 100,
    });
    expect(policy.getRule("timeout", 0)).toBe(5000);
    expect(policy.getRule("nonexistent", "default")).toBe("default");
  });
});
