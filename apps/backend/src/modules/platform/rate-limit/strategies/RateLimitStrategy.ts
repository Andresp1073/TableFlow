import type { RateLimitStrategy as RateLimitStrategyInterface, RateLimitCounter, RateLimitPolicyConfig, RateLimitDecision } from "../types.js";
import { createAllowedDecision, createRejectedDecision, createDefaultDecision } from "../RateLimitDecision.js";

export abstract class BaseStrategy implements RateLimitStrategyInterface {
  abstract readonly type: RateLimitStrategyType;
  abstract check(key: string, counter: RateLimitCounter, policy: RateLimitPolicyConfig): Promise<RateLimitDecision>;

  protected allowed(remaining: number, limit: number, resetTime: Date, policyName: string): RateLimitDecision {
    return createAllowedDecision(remaining, limit, resetTime, policyName, this.type);
  }

  protected rejected(remaining: number, limit: number, retryAfterMs: number, resetTime: Date, policyName: string): RateLimitDecision {
    return createRejectedDecision(remaining, limit, retryAfterMs, resetTime, policyName, this.type);
  }

  protected defaultDecision(policy: RateLimitPolicyConfig): RateLimitDecision {
    return createDefaultDecision(policy, this.type);
  }
}
