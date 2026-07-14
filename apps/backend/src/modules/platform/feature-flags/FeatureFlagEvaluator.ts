import type {
  FeatureFlagRuleConfig,
  FeatureFlagContext,
  FeatureFlag,
  FeatureFlagDecision,
  FlagValue,
} from "./types.js";
import { createFeatureFlagContext, mergeContext } from "./FeatureFlagContext.js";
import { createEnabledDecision, createDisabledDecision } from "./FeatureFlagDecision.js";
import {
  BooleanRuleEvaluator,
  PercentageRuleEvaluator,
  DateRuleEvaluator,
  RoleRuleEvaluator,
  TenantRuleEvaluator,
  RestaurantRuleEvaluator,
  CompositeRuleEvaluator,
  type RuleEvaluator,
  type RuleEvaluationResult,
} from "./rules/index.js";
import { FeatureFlagEvaluationError, FeatureFlagRuleError } from "./errors.js";

export class FeatureFlagEvaluator {
  private readonly evaluators: Map<string, RuleEvaluator> = new Map();

  constructor() {
    this.registerDefaultEvaluators();
  }

  private registerDefaultEvaluators(): void {
    const booleanEval = new BooleanRuleEvaluator();
    const percentageEval = new PercentageRuleEvaluator();
    const dateEval = new DateRuleEvaluator();
    const roleEval = new RoleRuleEvaluator();
    const tenantEval = new TenantRuleEvaluator();
    const restaurantEval = new RestaurantRuleEvaluator();
    const isEnabledFn: import("./rules/index.js").IsEnabledFn = (rule, ctx) => this.isRuleEffectivelyEnabled(rule, ctx);
    const compositeEval = new CompositeRuleEvaluator(
      {
        evaluateSingleRule: (rule, ctx, key) => this.evaluateSingleRule(rule, ctx, key),
      },
      isEnabledFn,
    );

    this.register(booleanEval);
    this.register(percentageEval);
    this.register(dateEval);
    this.register(roleEval);
    this.register(tenantEval);
    this.register(restaurantEval);
    this.register(compositeEval);
  }

  register(evaluator: RuleEvaluator): void {
    this.evaluators.set(evaluator.type, evaluator);
  }

  evaluate(
    flag: FeatureFlag,
    context?: Partial<FeatureFlagContext>,
  ): FeatureFlagDecision {
    const fullContext = context
      ? mergeContext(createFeatureFlagContext(context), context)
      : createFeatureFlagContext();

    if (!flag.enabled) {
      return createDisabledDecision(
        flag.key,
        flag.defaultValue,
        "Flag is globally disabled",
        fullContext,
      );
    }

    const sortedRules = [...flag.rules].sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      try {
        const result = this.evaluateSingleRule(rule, fullContext, flag.key);

        if (result.matched) {
          const ruleEnabled = this.isRuleEffectivelyEnabled(rule, fullContext);
          const value = this.resolveValue(ruleEnabled, flag);

          if (ruleEnabled) {
            return createEnabledDecision(flag.key, value, result.reason ?? "Rule matched", rule, fullContext);
          }

          return createDisabledDecision(flag.key, value, result.reason ?? "Rule blocked", rule, fullContext);
        }
      } catch (error) {
        throw new FeatureFlagRuleError(
          flag.key,
          rule,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return createDisabledDecision(
      flag.key,
      flag.defaultValue,
      "No rules matched, using default (disabled)",
      fullContext,
    );
  }

  evaluateSingleRule(
    rule: FeatureFlagRuleConfig,
    context: FeatureFlagContext,
    flagKey: string,
  ): RuleEvaluationResult {
    const evaluator = this.evaluators.get(rule.type);

    if (!evaluator) {
      throw new FeatureFlagEvaluationError(
        flagKey,
        `No evaluator registered for rule type "${rule.type}"`,
      );
    }

    return evaluator.evaluate(rule, context, flagKey);
  }

  private isRuleEffectivelyEnabled(rule: FeatureFlagRuleConfig, context: FeatureFlagContext): boolean {
    switch (rule.type) {
      case "boolean":
        return rule.value;
      case "percentage": {
        const evaluator = this.evaluators.get("percentage") as PercentageRuleEvaluator;
        const result = evaluator.evaluate(rule, context, "");
        const hash = this.computePercentageHash(rule, context);

        return hash < rule.percentage;
      }
      case "date": {
        const now = new Date();

        switch (rule.condition) {
          case "before": {
            if (!rule.startDate) { return false; }
            return now < new Date(rule.startDate);
          }
          case "after": {
            if (!rule.endDate) { return false; }
            return now > new Date(rule.endDate);
          }
          case "between": {
            if (!rule.startDate || !rule.endDate) { return false; }
            return now >= new Date(rule.startDate) && now <= new Date(rule.endDate);
          }
        }
      }
      case "role":
        return new RoleRuleEvaluator().isEnabled(rule, context);
      case "tenant":
        return new TenantRuleEvaluator().isEnabled(rule, context);
      case "restaurant":
        return new RestaurantRuleEvaluator().isEnabled(rule, context);
      case "composite":
        return this.evaluateCompositeEnabled(rule, context);
    }
  }

  private evaluateCompositeEnabled(
    rule: import("./types.js").CompositeRuleConfig,
    context: FeatureFlagContext,
  ): boolean {
    switch (rule.operator) {
      case "AND":
        return rule.rules.every((subRule) => this.isRuleEffectivelyEnabled(subRule, context));
      case "OR":
        return rule.rules.some((subRule) => this.isRuleEffectivelyEnabled(subRule, context));
      case "NOT":
        if (rule.rules.length === 0) { return false; }
        return !this.isRuleEffectivelyEnabled(rule.rules[0], context);
    }
  }

  private computePercentageHash(rule: import("./types.js").PercentageRuleConfig, context: FeatureFlagContext): number {
    const entityId = this.resolveEntityId(rule, context);

    if (!entityId) {
      return 100;
    }

    return Math.abs(this.hashCode(`${context.environment ?? "default"}:${entityId}`)) % 100;
  }

  private resolveEntityId(
    rule: import("./types.js").PercentageRuleConfig,
    context: FeatureFlagContext,
  ): string | null {
    if (rule.sticky && rule.entityField) {
      const value = context[rule.entityField];

      if (value !== undefined && value !== null) {
        return String(value);
      }
    }

    return context.userId ?? context.tenantId ?? context.restaurantId ?? null;
  }

  private hashCode(value: string): number {
    let hash = 0;

    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return hash;
  }

  private resolveValue(enabled: boolean, flag: FeatureFlag): FlagValue {
    if (enabled) {
      return flag.defaultValue;
    }

    switch (flag.type) {
      case "boolean":
        return false;
      case "number":
        return 0;
      case "string":
        return "";
    }
  }
}
