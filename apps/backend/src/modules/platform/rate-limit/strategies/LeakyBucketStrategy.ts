import { BaseStrategy } from "./RateLimitStrategy.js";
import type { RateLimitCounter, RateLimitPolicyConfig, RateLimitDecision, LeakyBucketData } from "../types.js";

export class LeakyBucketStrategy extends BaseStrategy {
  readonly type = "leaky_bucket" as const;

  async check(key: string, counter: RateLimitCounter, policy: RateLimitPolicyConfig): Promise<RateLimitDecision> {
    const now = Date.now();
    const capacity = policy.maxRequests;
    const leakRate = capacity / (policy.windowMs / 1000);
    const ttlMs = policy.windowMs * 2;

    let bucket = await counter.getLeakyBucket(key);

    if (!bucket) {
      bucket = {
        water: 0,
        lastLeak: now,
        capacity,
        leakRate,
      };

      await counter.setLeakyBucket(key, bucket, ttlMs);
    }

    const elapsedSec = (now - bucket.lastLeak) / 1000;
    const leaked = elapsedSec * bucket.leakRate;
    const newWater = Math.max(0, bucket.water - leaked);

    if (newWater >= bucket.capacity) {
      const dripRate = 1000 / bucket.leakRate;
      const retryAfterMs = Math.ceil(dripRate);

      bucket.water = newWater;
      bucket.lastLeak = now;
      await counter.setLeakyBucket(key, bucket, ttlMs);

      return this.rejected(0, capacity, retryAfterMs, new Date(now + retryAfterMs), policy.name);
    }

    bucket.water = newWater + 1;
    bucket.lastLeak = now;
    await counter.setLeakyBucket(key, bucket, ttlMs);

    return this.allowed(Math.floor(capacity - bucket.water), capacity, new Date(now + policy.windowMs), policy.name);
  }
}
