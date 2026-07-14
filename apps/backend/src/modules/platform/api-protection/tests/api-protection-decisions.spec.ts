import { describe, it, expect } from "vitest";
import { createAllowedDecision, createRejectedDecision, createWarningDecision, createContinueDecision, isAllowed, isRejected, isWarning, isContinue, isTerminal, severityScore } from "../ProtectionDecision.js";

describe("ProtectionDecision", () => {
  describe("createAllowedDecision", () => {
    it("creates an allowed decision", () => {
      const d = createAllowedDecision("test_rule", { key: "value" });

      expect(d.action).toBe("allow");
      expect(d.ruleName).toBe("test_rule");
      expect(d.reason).toBe("Request passed validation");
      expect(d.details).toEqual({ key: "value" });
      expect(d.timestamp).toBeInstanceOf(Date);
    });
  });

  describe("createRejectedDecision", () => {
    it("creates a rejected decision with defaults", () => {
      const d = createRejectedDecision("block_rule", "Bad request", "malformed_request");

      expect(d.action).toBe("reject");
      expect(d.ruleName).toBe("block_rule");
      expect(d.reason).toBe("Bad request");
      expect(d.threatCategory).toBe("malformed_request");
      expect(d.severity).toBe("high");
    });

    it("creates a rejected decision with custom severity", () => {
      const d = createRejectedDecision("critical_rule", "Critical threat", "sql_injection", "critical", { query: "DROP" });

      expect(d.action).toBe("reject");
      expect(d.severity).toBe("critical");
      expect(d.details).toEqual({ query: "DROP" });
    });
  });

  describe("createWarningDecision", () => {
    it("creates a warning decision", () => {
      const d = createWarningDecision("warn_rule", "Suspicious", "request_anomaly", "medium");

      expect(d.action).toBe("warn");
      expect(d.severity).toBe("medium");
      expect(d.threatCategory).toBe("request_anomaly");
    });
  });

  describe("createContinueDecision", () => {
    it("creates a continue decision", () => {
      const d = createContinueDecision("passthrough_rule");

      expect(d.action).toBe("continue");
      expect(d.reason).toBe("Rule does not apply, passing to next");
    });
  });

  describe("predicates", () => {
    it("isAllowed returns true for allow", () => {
      expect(isAllowed(createAllowedDecision("r"))).toBe(true);
      expect(isAllowed(createRejectedDecision("r", "x"))).toBe(false);
    });

    it("isRejected returns true for reject", () => {
      expect(isRejected(createRejectedDecision("r", "x"))).toBe(true);
      expect(isRejected(createAllowedDecision("r"))).toBe(false);
    });

    it("isWarning returns true for warn", () => {
      expect(isWarning(createWarningDecision("r", "x"))).toBe(true);
      expect(isWarning(createAllowedDecision("r"))).toBe(false);
    });

    it("isContinue returns true for continue", () => {
      expect(isContinue(createContinueDecision("r"))).toBe(true);
      expect(isContinue(createAllowedDecision("r"))).toBe(false);
    });

    it("isTerminal returns true only for reject", () => {
      expect(isTerminal(createRejectedDecision("r", "x"))).toBe(true);
      expect(isTerminal(createAllowedDecision("r"))).toBe(false);
      expect(isTerminal(createWarningDecision("r", "x"))).toBe(false);
      expect(isTerminal(createContinueDecision("r"))).toBe(false);
    });
  });

  describe("severityScore", () => {
    it("returns correct scores", () => {
      expect(severityScore("low")).toBe(1);
      expect(severityScore("medium")).toBe(2);
      expect(severityScore("high")).toBe(3);
      expect(severityScore("critical")).toBe(4);
    });
  });
});
