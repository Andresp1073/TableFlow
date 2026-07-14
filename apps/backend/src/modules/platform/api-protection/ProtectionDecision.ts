import type { ProtectionDecision, ProtectionAction, ThreatCategory } from "./types.js";

export function createAllowedDecision(ruleName: string, details?: Record<string, unknown>): ProtectionDecision {
  return {
    action: "allow",
    ruleName,
    reason: "Request passed validation",
    details,
    timestamp: new Date(),
  };
}

export function createRejectedDecision(
  ruleName: string,
  reason: string,
  threatCategory?: ThreatCategory,
  severity?: "low" | "medium" | "high" | "critical",
  details?: Record<string, unknown>,
): ProtectionDecision {
  return {
    action: "reject",
    ruleName,
    reason,
    threatCategory,
    severity: severity ?? "high",
    details,
    timestamp: new Date(),
  };
}

export function createWarningDecision(
  ruleName: string,
  reason: string,
  threatCategory?: ThreatCategory,
  severity?: "low" | "medium" | "high" | "critical",
  details?: Record<string, unknown>,
): ProtectionDecision {
  return {
    action: "warn",
    ruleName,
    reason,
    threatCategory,
    severity: severity ?? "low",
    details,
    timestamp: new Date(),
  };
}

export function createContinueDecision(ruleName: string, reason?: string): ProtectionDecision {
  return {
    action: "continue",
    ruleName,
    reason: reason ?? "Rule does not apply, passing to next",
    timestamp: new Date(),
  };
}

export function isAllowed(decision: ProtectionDecision): boolean {
  return decision.action === "allow";
}

export function isRejected(decision: ProtectionDecision): boolean {
  return decision.action === "reject";
}

export function isWarning(decision: ProtectionDecision): boolean {
  return decision.action === "warn";
}

export function isContinue(decision: ProtectionDecision): boolean {
  return decision.action === "continue";
}

export function isTerminal(decision: ProtectionDecision): boolean {
  return decision.action === "reject";
}

export function severityScore(severity: "low" | "medium" | "high" | "critical"): number {
  switch (severity) {
    case "low": { return 1; }
    case "medium": { return 2; }
    case "high": { return 3; }
    case "critical": { return 4; }
  }
}
