import { describe, it, expect } from "vitest";
import { PaymentIntent, PaymentIntentStatus } from "../domain/models/PaymentIntent.js";

describe("PaymentIntent", () => {
  it("creates a payment intent with valid data", () => {
    const intent = PaymentIntent.create({
      id: "pi-1",
      amount: 5000,
      currency: "USD",
      reference: "REF-001",
      restaurantId: "rest-1",
      allowedMethods: ["credit_card", "debit_card"],
      metadata: {},
      expiresAt: null,
    });
    expect(intent.id).toBe("pi-1");
    expect(intent.amount).toBe(5000);
    expect(intent.status).toBe(PaymentIntentStatus.Created);
  });

  it("rejects zero amount", () => {
    expect(() =>
      PaymentIntent.create({
        id: "pi-2",
        amount: 0,
        currency: "USD",
        reference: "REF-002",
        restaurantId: "rest-1",
        allowedMethods: [],
        metadata: {},
        expiresAt: null,
      }),
    ).toThrow("Amount must be positive");
  });

  it("rejects empty reference", () => {
    expect(() =>
      PaymentIntent.create({
        id: "pi-3",
        amount: 1000,
        currency: "USD",
        reference: "",
        restaurantId: "rest-1",
        allowedMethods: [],
        metadata: {},
        expiresAt: null,
      }),
    ).toThrow("Reference cannot be empty");
  });

  it("marks as processing", () => {
    const intent = PaymentIntent.create({
      id: "pi-4",
      amount: 5000,
      currency: "USD",
      reference: "REF-004",
      restaurantId: "rest-1",
      allowedMethods: [],
      metadata: {},
      expiresAt: null,
    });
    const processing = intent.markProcessing();
    expect(processing.status).toBe(PaymentIntentStatus.Processing);
  });

  it("marks as succeeded", () => {
    const intent = PaymentIntent.create({
      id: "pi-5",
      amount: 5000,
      currency: "USD",
      reference: "REF-005",
      restaurantId: "rest-1",
      allowedMethods: [],
      metadata: {},
      expiresAt: null,
    });
    const succeeded = intent.markSucceeded();
    expect(succeeded.status).toBe(PaymentIntentStatus.Succeeded);
  });

  it("marks as failed", () => {
    const intent = PaymentIntent.create({
      id: "pi-6",
      amount: 5000,
      currency: "USD",
      reference: "REF-006",
      restaurantId: "rest-1",
      allowedMethods: [],
      metadata: {},
      expiresAt: null,
    });
    const failed = intent.markFailed("Insufficient funds");
    expect(failed.status).toBe(PaymentIntentStatus.Failed);
    expect(failed.metadata.failureReason).toBe("Insufficient funds");
  });

  it("detects settled statuses", () => {
    const intent = PaymentIntent.create({
      id: "pi-7",
      amount: 5000,
      currency: "USD",
      reference: "REF-007",
      restaurantId: "rest-1",
      allowedMethods: [],
      metadata: {},
      expiresAt: null,
    });
    expect(intent.isSettled()).toBe(false);
    expect(intent.markSucceeded().isSettled()).toBe(true);
    expect(intent.markFailed().isSettled()).toBe(true);
    expect(intent.markCancelled().isSettled()).toBe(true);
  });

  it("detects expiry", () => {
    const intent = PaymentIntent.create({
      id: "pi-8",
      amount: 5000,
      currency: "USD",
      reference: "REF-008",
      restaurantId: "rest-1",
      allowedMethods: [],
      metadata: {},
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(intent.isExpired()).toBe(true);
  });
});
