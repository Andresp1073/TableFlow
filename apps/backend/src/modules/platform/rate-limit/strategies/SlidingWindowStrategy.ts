import { BaseStrategy } from "./RateLimitStrategy.js";
import type { RateLimitCounter, RateLimitPolicyConfig, RateLimitDecision, RateLimitWindowData } from "../types.js";

export class SlidingWindowStrategy extends BaseStrategy {
  readonly type = "sliding_window" as const;

  async check(key: string, counter: RateLimitCounter, policy: RateLimitPolicyConfig): Promise<RateLimitDecision> {
    const now = Date.now();
    const windowMs = policy.windowMs;
    const burstLimit = policy.burstMultiplier
      ? Math.floor(policy.maxRequests * policy.burstMultiplier)
      : policy.maxRequests;

    let windowData = await counter.getWindow(key);

    if (!windowData || now >= windowData.expiresAt) {
      windowData = {
        count: 0,
        windowStart: now,
        expiresAt: now + windowMs,
      };
    }

    const elapsed = now - windowData.windowStart;
    const weight = elapsed > 0 ? Math.min(1, windowMs / elapsed) : 1;
    const estimatedCount = Math.ceil(windowData.count * weight);
    const newCount = estimatedCount + 1;

    if (newCount > burstLimit) {
      const retryAfterMs = Math.max(1, windowData.expiresAt - now);

      return this.rejected(
        Math.max(0, burstLimit - estimatedCount),
        burstLimit,
        retryAfterMs,
        new Date(windowData.expiresAt),
        policy.name,
      );
    }

    windowData.count++;
    await counter.setWindow(key, windowData, windowMs);

    return this.allowed(
      Math.max(0, burstLimit - newCount),
      burstLimit,
      new Date(windowData.expiresAt),
      policy.name,
    );
  }
}
