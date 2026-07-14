import type { RateLimitPolicyConfig, RateLimitStrategyType, LimitDimension } from "./types.js";

export function createPolicy(config: Partial<RateLimitPolicyConfig> & { name: string }): RateLimitPolicyConfig {
  return {
    name: config.name,
    strategy: config.strategy ?? "fixed_window",
    maxRequests: config.maxRequests ?? 100,
    windowMs: config.windowMs ?? 60_000,
    burstMultiplier: config.burstMultiplier,
    dimensions: config.dimensions ?? ["ip"],
    enabled: config.enabled ?? true,
  };
}

export const DEFAULT_POLICIES: Record<string, RateLimitPolicyConfig> = {
  login: createPolicy({
    name: "login",
    strategy: "sliding_window",
    maxRequests: 5,
    windowMs: 60_000,
    dimensions: ["ip", "user"],
  }),
  reservation_api: createPolicy({
    name: "reservation_api",
    strategy: "sliding_window",
    maxRequests: 60,
    windowMs: 60_000,
    burstMultiplier: 1.5,
    dimensions: ["user", "restaurant"],
  }),
  public_booking_api: createPolicy({
    name: "public_booking_api",
    strategy: "token_bucket",
    maxRequests: 30,
    windowMs: 60_000,
    dimensions: ["ip"],
  }),
  admin_api: createPolicy({
    name: "admin_api",
    strategy: "fixed_window",
    maxRequests: 200,
    windowMs: 60_000,
    dimensions: ["user", "role"],
  }),
  webhook_api: createPolicy({
    name: "webhook_api",
    strategy: "leaky_bucket",
    maxRequests: 100,
    windowMs: 60_000,
    dimensions: ["api_key"],
  }),
};
