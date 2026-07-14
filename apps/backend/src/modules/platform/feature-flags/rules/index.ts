import type {
  FeatureFlagRuleConfig,
  FeatureFlagContext,
  BooleanRuleConfig,
  PercentageRuleConfig,
  DateRuleConfig,
  RoleRuleConfig,
  TenantRuleConfig,
  RestaurantRuleConfig,
  CompositeRuleConfig,
} from "../types.js";

export type RuleEvaluationResult = {
  matched: boolean;
  reason?: string;
};

export type IsEnabledFn = (rule: FeatureFlagRuleConfig, context: FeatureFlagContext) => boolean;

export interface RuleEvaluator<T extends FeatureFlagRuleConfig = FeatureFlagRuleConfig> {
  readonly type: string;
  evaluate(rule: T, context: FeatureFlagContext, flagKey: string): RuleEvaluationResult;
}

export class BooleanRuleEvaluator implements RuleEvaluator<BooleanRuleConfig> {
  readonly type = "boolean";

  evaluate(rule: BooleanRuleConfig, _context: FeatureFlagContext, _flagKey: string): RuleEvaluationResult {
    return {
      matched: true,
      reason: `Boolean rule: ${rule.value}`,
    };
  }
}

export class PercentageRuleEvaluator implements RuleEvaluator<PercentageRuleConfig> {
  readonly type = "percentage";

  evaluate(rule: PercentageRuleConfig, context: FeatureFlagContext, flagKey: string): RuleEvaluationResult {
    const entityId = this.resolveEntityId(rule, context);

    if (!entityId) {
      return {
        matched: false,
        reason: "Percentage rule: no entity ID available for consistent rollout",
      };
    }

    const hash = this.hashCode(`${flagKey}:${entityId}`);
    const normalizedHash = Math.abs(hash) % 100;

    const inRange = normalizedHash < rule.percentage;

    return {
      matched: true,
      reason: `Percentage rule: ${rule.percentage}% (hash: ${normalizedHash})`,
    };
  }

  private resolveEntityId(rule: PercentageRuleConfig, context: FeatureFlagContext): string | null {
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
}

export class DateRuleEvaluator implements RuleEvaluator<DateRuleConfig> {
  readonly type = "date";

  evaluate(rule: DateRuleConfig, _context: FeatureFlagContext, _flagKey: string): RuleEvaluationResult {
    const now = new Date();

    switch (rule.condition) {
      case "before": {
        if (!rule.startDate) {
          return { matched: false, reason: "Date rule: missing startDate" };
        }

        const startDate = new Date(rule.startDate);

        if (isNaN(startDate.getTime())) {
          return { matched: false, reason: "Date rule: invalid startDate" };
        }

        const isBefore = now < startDate;

        return {
          matched: true,
          reason: `Date rule: before ${rule.startDate} (${isBefore ? "active" : "inactive"})`,
        };
      }

      case "after": {
        if (!rule.endDate) {
          return { matched: false, reason: "Date rule: missing endDate" };
        }

        const endDate = new Date(rule.endDate);

        if (isNaN(endDate.getTime())) {
          return { matched: false, reason: "Date rule: invalid endDate" };
        }

        const isAfter = now > endDate;

        return {
          matched: true,
          reason: `Date rule: after ${rule.endDate} (${isAfter ? "active" : "inactive"})`,
        };
      }

      case "between": {
        if (!rule.startDate || !rule.endDate) {
          return { matched: false, reason: "Date rule: missing startDate or endDate for between" };
        }

        const start = new Date(rule.startDate);
        const end = new Date(rule.endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return { matched: false, reason: "Date rule: invalid dates for between" };
        }

        const isBetween = now >= start && now <= end;

        return {
          matched: true,
          reason: `Date rule: between ${rule.startDate} and ${rule.endDate} (${isBetween ? "active" : "inactive"})`,
        };
      }
    }
  }
}

export class RoleRuleEvaluator implements RuleEvaluator<RoleRuleConfig> {
  readonly type = "role";

  evaluate(rule: RoleRuleConfig, context: FeatureFlagContext, _flagKey: string): RuleEvaluationResult {
    const userRoles = context.roles ?? [];

    if (userRoles.length === 0) {
      return {
        matched: false,
        reason: "Role rule: no user roles available in context",
      };
    }

    const hasRole = rule.roles.some((role) => userRoles.includes(role));

    if (rule.mode === "allow") {
      return {
        matched: true,
        reason: `Role rule: allow ${hasRole ? "matched" : "not matched"}`,
      };
    }

    return {
      matched: true,
      reason: `Role rule: deny ${hasRole ? "blocked" : "allowed"}`,
    };
  }

  isEnabled(rule: RoleRuleConfig, context: FeatureFlagContext): boolean {
    const userRoles = context.roles ?? [];
    const hasRole = rule.roles.some((role) => userRoles.includes(role));

    if (rule.mode === "allow") {
      return hasRole;
    }

    return !hasRole;
  }
}

export class TenantRuleEvaluator implements RuleEvaluator<TenantRuleConfig> {
  readonly type = "tenant";

  evaluate(rule: TenantRuleConfig, context: FeatureFlagContext, _flagKey: string): RuleEvaluationResult {
    const tenantId = context.tenantId;

    if (!tenantId) {
      return {
        matched: false,
        reason: "Tenant rule: no tenant ID in context",
      };
    }

    const isListed = rule.tenantIds.includes(tenantId);

    if (rule.mode === "allow") {
      return {
        matched: true,
        reason: `Tenant rule: allow ${isListed ? "matched" : "not matched"}`,
      };
    }

    return {
      matched: true,
      reason: `Tenant rule: deny ${isListed ? "blocked" : "allowed"}`,
    };
  }

  isEnabled(rule: TenantRuleConfig, context: FeatureFlagContext): boolean {
    if (!context.tenantId) {
      return rule.mode === "deny";
    }

    const isListed = rule.tenantIds.includes(context.tenantId);

    if (rule.mode === "allow") {
      return isListed;
    }

    return !isListed;
  }
}

export class RestaurantRuleEvaluator implements RuleEvaluator<RestaurantRuleConfig> {
  readonly type = "restaurant";

  evaluate(rule: RestaurantRuleConfig, context: FeatureFlagContext, _flagKey: string): RuleEvaluationResult {
    const restaurantId = context.restaurantId;

    if (!restaurantId) {
      return {
        matched: false,
        reason: "Restaurant rule: no restaurant ID in context",
      };
    }

    const isListed = rule.restaurantIds.includes(restaurantId);

    if (rule.mode === "allow") {
      return {
        matched: true,
        reason: `Restaurant rule: allow ${isListed ? "matched" : "not matched"}`,
      };
    }

    return {
      matched: true,
      reason: `Restaurant rule: deny ${isListed ? "blocked" : "allowed"}`,
    };
  }

  isEnabled(rule: RestaurantRuleConfig, context: FeatureFlagContext): boolean {
    if (!context.restaurantId) {
      return rule.mode === "deny";
    }

    const isListed = rule.restaurantIds.includes(context.restaurantId);

    if (rule.mode === "allow") {
      return isListed;
    }

    return !isListed;
  }
}

export class CompositeRuleEvaluator implements RuleEvaluator<CompositeRuleConfig> {
  private readonly evaluator: FeatureFlagEvaluatorCore;
  private readonly isEnabledFn?: IsEnabledFn;

  constructor(evaluator: FeatureFlagEvaluatorCore, isEnabledFn?: IsEnabledFn) {
    this.evaluator = evaluator;
    this.isEnabledFn = isEnabledFn;
  }

  readonly type = "composite";

  evaluate(rule: CompositeRuleConfig, context: FeatureFlagContext, flagKey: string): RuleEvaluationResult {
    switch (rule.operator) {
      case "AND": {
        for (const subRule of rule.rules) {
          const result = this.evaluator.evaluateSingleRule(subRule, context, flagKey);

          if (!result.matched) {
            return {
              matched: false,
              reason: `Composite AND: sub-rule ${subRule.type} did not match`,
            };
          }
        }

        return {
          matched: true,
          reason: "Composite AND: all sub-rules matched",
        };
      }

      case "OR": {
        for (const subRule of rule.rules) {
          const result = this.evaluator.evaluateSingleRule(subRule, context, flagKey);

          if (result.matched) {
            return {
              matched: true,
              reason: `Composite OR: sub-rule ${subRule.type} matched`,
            };
          }
        }

        return {
          matched: false,
          reason: "Composite OR: no sub-rules matched",
        };
      }

      case "NOT": {
        if (rule.rules.length === 0) {
          return { matched: false, reason: "Composite NOT: no sub-rules" };
        }

        const subRule = rule.rules[0];
        const subEnabled = this.isEnabledFn
          ? this.isEnabledFn(subRule, context)
          : false;

        return {
          matched: true,
          reason: `Composite NOT: ${subEnabled ? "inverted to disabled" : "inverted to enabled"}`,
        };
      }
    }
  }
}

export type FeatureFlagEvaluatorCore = {
  evaluateSingleRule(rule: FeatureFlagRuleConfig, context: FeatureFlagContext, flagKey: string): RuleEvaluationResult;
};
