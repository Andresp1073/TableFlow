import type { FeatureFlagRuleConfig } from "./types.js";

export class FeatureFlagError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly flagKey?: string,
  ) {
    super(message);
    this.name = "FeatureFlagError";
  }
}

export class FeatureFlagNotFoundError extends FeatureFlagError {
  constructor(key: string) {
    super(`Feature flag "${key}" not found`, "FLAG_NOT_FOUND", key);
    this.name = "FeatureFlagNotFoundError";
  }
}

export class FeatureFlagEvaluationError extends FeatureFlagError {
  constructor(key: string, reason: string) {
    super(`Evaluation failed for flag "${key}": ${reason}`, "FLAG_EVALUATION_FAILED", key);
    this.name = "FeatureFlagEvaluationError";
  }
}

export class FeatureFlagRuleError extends FeatureFlagError {
  constructor(key: string, rule: FeatureFlagRuleConfig, reason: string) {
    super(`Rule error for flag "${key}" (${rule.type}): ${reason}`, "FLAG_RULE_ERROR", key);
    this.name = "FeatureFlagRuleError";
  }
}

export class FeatureFlagValidationError extends FeatureFlagError {
  constructor(key: string, public readonly errors: Array<{ field: string; message: string }>) {
    super(
      `Validation failed for flag "${key}": ${errors.map((e) => e.message).join("; ")}`,
      "FLAG_VALIDATION_FAILED",
      key,
    );
    this.name = "FeatureFlagValidationError";
  }
}
