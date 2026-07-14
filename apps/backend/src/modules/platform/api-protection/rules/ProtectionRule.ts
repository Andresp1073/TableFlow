import type { ProtectionContext, ProtectionDecision, ThreatCategory } from "../types.js";

export abstract class BaseRule {
  readonly name: string;
  readonly priority: number;
  readonly enabled: boolean;

  constructor(name: string, priority: number, enabled = true) {
    this.name = name;
    this.priority = priority;
    this.enabled = enabled;
  }

  abstract evaluate(context: ProtectionContext): Promise<ProtectionDecision>;

  protected allowed(details?: Record<string, unknown>): ProtectionDecision {
    return {
      action: "allow",
      ruleName: this.name,
      reason: "Request passed validation",
      details,
      timestamp: new Date(),
    };
  }

  protected rejected(
    reason: string,
    threatCategory?: ThreatCategory,
    severity?: "low" | "medium" | "high" | "critical",
    details?: Record<string, unknown>,
  ): ProtectionDecision {
    return {
      action: "reject",
      ruleName: this.name,
      reason,
      threatCategory,
      severity: severity ?? "high",
      details,
      timestamp: new Date(),
    };
  }

  protected warning(
    reason: string,
    threatCategory?: ThreatCategory,
    severity?: "low" | "medium" | "high" | "critical",
    details?: Record<string, unknown>,
  ): ProtectionDecision {
    return {
      action: "warn",
      ruleName: this.name,
      reason,
      threatCategory,
      severity: severity ?? "low",
      details,
      timestamp: new Date(),
    };
  }

  protected skip(reason?: string): ProtectionDecision {
    return {
      action: "continue",
      ruleName: this.name,
      reason: reason ?? "Rule does not apply, passing to next",
      timestamp: new Date(),
    };
  }
}
