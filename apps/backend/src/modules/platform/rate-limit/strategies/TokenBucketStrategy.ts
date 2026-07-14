import { BaseStrategy } from "./RateLimitStrategy.js";
import type { RateLimitCounter, RateLimitPolicyConfig, RateLimitDecision, TokenBucketData } from "../types.js";

export class TokenBucketStrategy extends BaseStrategy {
  readonly type = "token_bucket" as const;

  async check(key: string, counter: RateLimitCounter, policy: RateLimitPolicyConfig): Promise<RateLimitDecision> {
    const now = Date.now();
    const capacity = policy.maxRequests;
    const refillRate = capacity / (policy.windowMs / 1000);
    const ttlMs = policy.windowMs * 2;

    let bucket = await counter.getTokenBucket(key);

    if (!bucket) {
      bucket = {
        tokens: capacity - 1,
        lastRefill: now,
        capacity,
        refillRate,
      };

      await counter.setTokenBucket(key, bucket, ttlMs);

      return this.allowed(bucket.tokens, capacity, new Date(now + policy.windowMs), policy.name);
    }

    const elapsedSec = (now - bucket.lastRefill) / 1000;
    const refillTokens = elapsedSec * bucket.refillRate;
    const newTokens = Math.min(bucket.capacity, bucket.tokens + refillTokens);

    if (newTokens < 1) {
      const retryAfterMs = Math.ceil((1 - newTokens) / bucket.refillRate * 1000);

      bucket.tokens = newTokens;
      bucket.lastRefill = now;
      await counter.setTokenBucket(key, bucket, ttlMs);

      return this.rejected(0, capacity, retryAfterMs, new Date(now + retryAfterMs), policy.name);
    }

    bucket.tokens = newTokens - 1;
    bucket.lastRefill = now;
    await counter.setTokenBucket(key, bucket, ttlMs);

    return this.allowed(Math.floor(bucket.tokens), capacity, new Date(now + policy.windowMs), policy.name);
  }
}
