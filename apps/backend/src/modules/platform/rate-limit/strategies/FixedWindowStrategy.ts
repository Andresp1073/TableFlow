import { BaseStrategy } from "./RateLimitStrategy.js";
import type { RateLimitCounter, RateLimitPolicyConfig, RateLimitDecision, RateLimitWindowData } from "../types.js";

export class FixedWindowStrategy extends BaseStrategy {
  readonly type = "fixed_window" as const;

  async check(key: string, counter: RateLimitCounter, policy: RateLimitPolicyConfig): Promise<RateLimitDecision> {
    const now = Date.now();
    let windowData = await counter.getWindow(key);

    if (!windowData || now >= windowData.expiresAt) {
      windowData = {
        count: 0,
        windowStart: now,
        expiresAt: now + policy.windowMs,
      };
    }

    windowData.count++;

    if (windowData.count > policy.maxRequests) {
      return this.rejected(
        Math.max(0, policy.maxRequests - windowData.count + 1),
        policy.maxRequests,
        windowData.expiresAt - now,
        new Date(windowData.expiresAt),
        policy.name,
      );
    }

    await counter.setWindow(key, windowData, policy.windowMs);

    return this.allowed(
      policy.maxRequests - windowData.count,
      policy.maxRequests,
      new Date(windowData.expiresAt),
      policy.name,
    );
  }
}
