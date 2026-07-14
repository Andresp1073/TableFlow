import type { ProtectionPipeline as ProtectionPipelineInterface, ProtectionContext, ProtectionDecision, ProtectionRule, PipelineResult } from "./types.js";
import { isTerminal } from "./ProtectionDecision.js";

export class ProtectionPipeline implements ProtectionPipelineInterface {
  readonly name: string;
  private readonly rules: Map<string, ProtectionRule> = new Map();

  constructor(name = "default") {
    this.name = name;
  }

  addRule(rule: ProtectionRule): void {
    this.rules.set(rule.name, rule);
  }

  addRules(rules: ProtectionRule[]): void {
    for (const rule of rules) {
      this.rules.set(rule.name, rule);
    }
  }

  removeRule(name: string): void {
    this.rules.delete(name);
  }

  getRule(name: string): ProtectionRule | undefined {
    return this.rules.get(name);
  }

  async execute(context: ProtectionContext): Promise<PipelineResult> {
    const startTime = performance.now();
    const decisions: ProtectionDecision[] = [];

    const sortedRules = this.getSortedEnabled();

    for (const rule of sortedRules) {
      const decision = await rule.evaluate(context);

      decisions.push(decision);

      if (isTerminal(decision)) {
        const duration = performance.now() - startTime;

        return {
          passed: false,
          decisions,
          finalDecision: decision,
          duration,
        };
      }
    }

    const duration = performance.now() - startTime;
    const finalDecision = this.determineFinal(decisions);

    return {
      passed: finalDecision.action === "allow",
      decisions,
      finalDecision,
      duration,
    };
  }

  clear(): void {
    this.rules.clear();
  }

  ruleCount(): number {
    return this.rules.size;
  }

  private getSortedEnabled(): ProtectionRule[] {
    return Array.from(this.rules.values())
      .filter((r) => r.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  private determineFinal(decisions: ProtectionDecision[]): ProtectionDecision {
    for (const d of decisions) {
      if (d.action === "warn") {
        return d;
      }
    }

    const last = decisions[decisions.length - 1];

    if (last && last.action === "allow") {
      return last;
    }

    const anyAllow = decisions.find((d) => d.action === "allow");

    if (anyAllow) {
      return anyAllow;
    }

    return {
      action: "allow",
      ruleName: "pipeline",
      reason: "All rules passed or skipped",
      timestamp: new Date(),
    };
  }
}
