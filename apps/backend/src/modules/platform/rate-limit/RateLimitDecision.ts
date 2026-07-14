import type { RateLimitDecision, RateLimitPolicyConfig, RateLimitStrategyType } from "./types.js";

export function createAllowedDecision(
  remaining: number,
  limit: number,
  resetTime: Date,
  policyName: string,
  strategy: RateLimitStrategyType,
): RateLimitDecision {
  return {
    allowed: true,
    remaining,
    limit,
    resetTime,
    retryAfterMs: 0,
    policyName,
    strategy,
  };
}

export function createRejectedDecision(
  remaining: number,
  limit: number,
  retryAfterMs: number,
  resetTime: Date,
  policyName: string,
  strategy: RateLimitStrategyType,
): RateLimitDecision {
  return {
    allowed: false,
    remaining,
    limit,
    resetTime,
    retryAfterMs,
    policyName,
    strategy,
  };
}

export function createDefaultDecision(policy: RateLimitPolicyConfig, strategy: RateLimitStrategyType): RateLimitDecision {
  return {
    allowed: true,
    remaining: policy.maxRequests,
    limit: policy.maxRequests,
    resetTime: new Date(Date.now() + policy.windowMs),
    retryAfterMs: 0,
    policyName: policy.name,
    strategy,
  };
}
