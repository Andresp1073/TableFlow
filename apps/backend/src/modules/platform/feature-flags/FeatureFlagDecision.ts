import type { FeatureFlagRuleConfig, FeatureFlagContext } from "./types.js";

export function createEnabledDecision(
  key: string,
  value: boolean | string | number,
  reason: string,
  matchedRule?: FeatureFlagRuleConfig,
  context?: Partial<FeatureFlagContext>,
): import("./types.js").FeatureFlagDecision {
  return {
    key,
    enabled: true,
    value,
    reason,
    matchedRule,
    evaluatedAt: new Date(),
    context: context ?? {},
  };
}

export function createDisabledDecision(
  key: string,
  value: boolean | string | number,
  reason: string,
  matchedRule?: import("./types.js").FeatureFlagRuleConfig,
  context?: Partial<FeatureFlagContext>,
): import("./types.js").FeatureFlagDecision {
  return {
    key,
    enabled: false,
    value,
    reason,
    matchedRule,
    evaluatedAt: new Date(),
    context: context ?? {},
  };
}
