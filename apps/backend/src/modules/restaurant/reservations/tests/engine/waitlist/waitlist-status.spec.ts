import { describe, it, expect } from "vitest";
import { WaitlistStatus } from "../../../engine/waitlist/WaitlistStatus.js";

describe("WaitlistStatus", () => {
  const validStatuses = ["waiting", "eligible", "promoted", "expired", "cancelled"];

  it("creates valid statuses", () => {
    for (const status of validStatuses) {
      expect(WaitlistStatus.create(status).value).toBe(status);
    }
  });

  it("throws for invalid status", () => {
    expect(() => WaitlistStatus.create("invalid")).toThrow();
    expect(() => WaitlistStatus.create("")).toThrow();
  });

  it("normalizes whitespace and case", () => {
    expect(WaitlistStatus.create("  WAITING  ").value).toBe("waiting");
    expect(WaitlistStatus.create("Eligible").value).toBe("eligible");
    expect(WaitlistStatus.create("PROMOTED").value).toBe("promoted");
  });

  it("validates transitions from waiting", () => {
    const waiting = WaitlistStatus.create("waiting");
    expect(waiting.isTransitionValid("eligible")).toBe(true);
    expect(waiting.isTransitionValid("expired")).toBe(true);
    expect(waiting.isTransitionValid("cancelled")).toBe(true);
    expect(waiting.isTransitionValid("promoted")).toBe(false);
  });

  it("validates transitions from eligible", () => {
    const eligible = WaitlistStatus.create("eligible");
    expect(eligible.isTransitionValid("promoted")).toBe(true);
    expect(eligible.isTransitionValid("expired")).toBe(true);
    expect(eligible.isTransitionValid("cancelled")).toBe(true);
    expect(eligible.isTransitionValid("waiting")).toBe(false);
  });

  it("terminal states have no transitions", () => {
    expect(WaitlistStatus.create("promoted").getAllowedTransitions()).toHaveLength(0);
    expect(WaitlistStatus.create("expired").getAllowedTransitions()).toHaveLength(0);
    expect(WaitlistStatus.create("cancelled").getAllowedTransitions()).toHaveLength(0);
  });

  it("detects active and terminal states", () => {
    expect(WaitlistStatus.create("waiting").isActive()).toBe(true);
    expect(WaitlistStatus.create("eligible").isActive()).toBe(true);
    expect(WaitlistStatus.create("promoted").isActive()).toBe(false);
    expect(WaitlistStatus.create("promoted").isTerminal()).toBe(true);
    expect(WaitlistStatus.create("expired").isTerminal()).toBe(true);
    expect(WaitlistStatus.create("cancelled").isTerminal()).toBe(true);
  });

  it("checks specific status helpers", () => {
    expect(WaitlistStatus.create("waiting").isWaiting()).toBe(true);
    expect(WaitlistStatus.create("eligible").isEligible()).toBe(true);
    expect(WaitlistStatus.create("promoted").isPromoted()).toBe(true);
    expect(WaitlistStatus.create("expired").isExpired()).toBe(true);
    expect(WaitlistStatus.create("cancelled").isCancelled()).toBe(true);
  });

  it("checks equality", () => {
    expect(WaitlistStatus.create("waiting").equals(WaitlistStatus.create("waiting"))).toBe(true);
    expect(WaitlistStatus.create("waiting").equals(WaitlistStatus.create("promoted"))).toBe(false);
  });

  it("reconstitutes from stored value", () => {
    expect(WaitlistStatus.reconstitute("promoted").value).toBe("promoted");
    expect(WaitlistStatus.reconstitute("expired").value).toBe("expired");
  });

  it("has correct static constants", () => {
    expect(WaitlistStatus.WAITING).toBe("waiting");
    expect(WaitlistStatus.ELIGIBLE).toBe("eligible");
    expect(WaitlistStatus.PROMOTED).toBe("promoted");
    expect(WaitlistStatus.EXPIRED).toBe("expired");
    expect(WaitlistStatus.CANCELLED).toBe("cancelled");
  });
});
