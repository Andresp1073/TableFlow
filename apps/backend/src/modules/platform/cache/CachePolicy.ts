import type { CachePolicy as CachePolicyInterface, CacheExpirationType } from "./types.js";

export type { CachePolicyInterface };
export type { CacheExpirationType };

export class CachePolicy {
  static absolute(ttlMs: number): CachePolicyInterface {
    return { type: "absolute", ttlMs };
  }

  static sliding(windowMs: number): CachePolicyInterface {
    return { type: "sliding", slidingWindowMs: windowMs };
  }

  static none(): CachePolicyInterface {
    return { type: "none" };
  }

  static custom(ttlMs: number, slidingWindowMs?: number): CachePolicyInterface {
    return {
      type: "custom",
      ttlMs,
      ...(slidingWindowMs !== undefined ? { slidingWindowMs } : {}),
    };
  }

  static defaultTTL(): CachePolicyInterface {
    return CachePolicy.absolute(300_000);
  }

  static from(policy: Partial<CachePolicyInterface> & { type?: CacheExpirationType }): CachePolicyInterface {
    return {
      type: policy.type ?? "absolute",
      ttlMs: policy.ttlMs ?? 300_000,
      slidingWindowMs: policy.slidingWindowMs,
    };
  }

  static resolveTTL(policy: CachePolicyInterface, currentTime: number, entryCreatedAt?: number): number | null {
    switch (policy.type) {
      case "absolute": {
        return policy.ttlMs ?? 300_000;
      }
      case "sliding": {
        return policy.slidingWindowMs ?? 300_000;
      }
      case "custom": {
        return policy.ttlMs ?? 300_000;
      }
      case "none": {
        return null;
      }
      default: {
        return policy.ttlMs ?? 300_000;
      }
    }
  }

  static isExpired(policy: CachePolicyInterface, expiresAt: number | null, _createdAt: number, currentTime: number): boolean {
    if (expiresAt === null) {
      return false;
    }

    return currentTime >= expiresAt;
  }

  static shouldRefreshSliding(policy: CachePolicyInterface, expiresAt: number | null, currentTime: number): boolean {
    if (policy.type !== "sliding" || expiresAt === null) {
      return false;
    }

    const remaining = expiresAt - currentTime;
    const windowMs = policy.slidingWindowMs ?? 300_000;
    const refreshThreshold = windowMs * 0.5;

    return remaining < refreshThreshold;
  }

  static computeExpiresAt(policy: CachePolicyInterface, currentTime: number): number | null {
    const ttl = CachePolicy.resolveTTL(policy, currentTime);

    if (ttl === null) {
      return null;
    }

    return currentTime + ttl;
  }
}
