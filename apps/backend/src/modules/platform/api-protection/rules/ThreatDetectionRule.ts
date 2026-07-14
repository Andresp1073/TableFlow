import { BaseRule } from "./ProtectionRule.js";
import type { ProtectionContext, ProtectionDecision, ThreatAnalyzer, ThreatAnalysis } from "../types.js";

export class ThreatDetectionRule extends BaseRule {
  private readonly threatAnalyzer: ThreatAnalyzer;
  private readonly escalateAbove: "low" | "medium" | "high" | "critical";

  constructor(
    threatAnalyzer: ThreatAnalyzer,
    priority = 70,
    escalateAbove: "low" | "medium" | "high" | "critical" = "medium",
    enabled = true,
  ) {
    super("threat_detection", priority, enabled);
    this.threatAnalyzer = threatAnalyzer;
    this.escalateAbove = escalateAbove;
  }

  async evaluate(context: ProtectionContext): Promise<ProtectionDecision> {
    const analysis = await this.threatAnalyzer.analyze(context);

    if (analysis.threats.length === 0) {
      return this.allowed({ riskScore: analysis.riskScore });
    }

    const criticalThreat = analysis.threats.find((t) => t.severity === "critical");
    const highThreat = analysis.threats.find((t) => t.severity === "high");
    const shouldReject = criticalThreat || highThreat;

    if (shouldReject) {
      return this.rejected(
        shouldReject.message,
        shouldReject.category,
        shouldReject.severity,
        {
          threats: analysis.threats,
          riskScore: analysis.riskScore,
        },
      );
    }

    return this.warning(
      `Threats detected: ${analysis.threats.length} finding(s)`,
      "request_anomaly",
      "medium",
      {
        threats: analysis.threats,
        riskScore: analysis.riskScore,
      },
    );
  }

  getAnalyzer(): ThreatAnalyzer {
    return this.threatAnalyzer;
  }
}
