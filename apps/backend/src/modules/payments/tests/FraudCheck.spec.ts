import { describe, it, expect } from "vitest";
import { PaymentFraudCheck, FraudRiskLevel } from "../domain/services/PaymentFraudCheck.js";
import type { FraudCheckInput, FraudCheckExtension } from "../domain/services/PaymentFraudCheck.js";

describe("PaymentFraudCheck", () => {
  it("returns low risk when no extensions registered", async () => {
    const fraudCheck = new PaymentFraudCheck();
    const input: FraudCheckInput = {
      amount: 5000,
      currency: "USD",
      restaurantId: "rest-1",
      methodType: "credit_card",
      metadata: {},
    };
    const result = await fraudCheck.evaluate(input);
    expect(result.riskLevel).toBe(FraudRiskLevel.Low);
    expect(result.score).toBe(0);
  });

  it("evaluates fraud extensions", async () => {
    const fraudCheck = new PaymentFraudCheck();
    const extension: FraudCheckExtension = {
      name: "high-amount-check",
      async check(input: FraudCheckInput) {
        if (input.amount > 100000) {
          return {
            riskLevel: FraudRiskLevel.High,
            score: 70,
            flags: ["high_amount"],
            recommendations: ["Require manual review"],
            requiresManualReview: true,
          };
        }
        return {
          riskLevel: FraudRiskLevel.Low,
          score: 0,
          flags: [],
          recommendations: [],
          requiresManualReview: false,
        };
      },
    };
    fraudCheck.registerExtension(extension);

    const lowResult = await fraudCheck.evaluate({
      amount: 5000,
      currency: "USD",
      restaurantId: "rest-1",
      methodType: "credit_card",
      metadata: {},
    });
    expect(lowResult.riskLevel).toBe(FraudRiskLevel.Low);

    const highResult = await fraudCheck.evaluate({
      amount: 200000,
      currency: "USD",
      restaurantId: "rest-1",
      methodType: "credit_card",
      metadata: {},
    });
    expect(highResult.riskLevel).toBe(FraudRiskLevel.High);
    expect(highResult.flags).toContain("high_amount");
  });

  it("handles extension errors gracefully", async () => {
    const fraudCheck = new PaymentFraudCheck();
    const extension: FraudCheckExtension = {
      name: "broken-check",
      async check() {
        throw new Error("Internal error");
      },
    };
    fraudCheck.registerExtension(extension);
    const result = await fraudCheck.evaluate({
      amount: 5000,
      currency: "USD",
      restaurantId: "rest-1",
      methodType: "credit_card",
      metadata: {},
    });
    expect(result.flags).toContain("broken-check: check failed");
  });
});
