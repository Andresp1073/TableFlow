import type { CacheProvider, CachePolicy as CachePolicyInterface } from "./types.js";
import { CachePolicy } from "./CachePolicy.js";

export interface GetOrSetFactory<T> {
  (): T | Promise<T>;
}

export class CacheManager {
  private readonly prefix?: string;

  constructor(
    private readonly provider: CacheProvider,
    options?: { prefix?: string },
  ) {
    this.prefix = options?.prefix;
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.resolveKey(key);
    const value = await this.provider.get<T>(fullKey);

    if (value !== null && this.provider.touch && this.hasSlidingPolicy(fullKey)) {
      const policy = await this.provider.getPolicy?.(fullKey);

      if (policy?.type === "sliding" && policy.slidingWindowMs) {
        const shouldRefresh = CachePolicy.shouldRefreshSliding(
          policy,
          Date.now() + policy.slidingWindowMs,
          Date.now(),
        );

        if (shouldRefresh) {
          await this.provider.touch(fullKey, policy.slidingWindowMs);
        }
      }
    }

    return value;
  }

  async set<T>(key: string, value: T, policy?: CachePolicyInterface): Promise<void> {
    const fullKey = this.resolveKey(key);

    await this.provider.set(fullKey, value, {
      policy: policy ?? CachePolicy.defaultTTL(),
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.provider.delete(this.resolveKey(key));
  }

  async exists(key: string): Promise<boolean> {
    return this.provider.exists(this.resolveKey(key));
  }

  async expire(key: string, ttlMs: number): Promise<boolean> {
    return this.provider.expire(this.resolveKey(key), ttlMs);
  }

  async clearByPrefix(prefix: string): Promise<number> {
    return this.provider.clearByPrefix(this.resolveKey(prefix));
  }

  async getOrSet<T>(key: string, factory: GetOrSetFactory<T>, policy?: CachePolicyInterface): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await Promise.resolve(factory());

    await this.set(key, value, policy);

    return value;
  }

  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const fullKeys = keys.map((k) => this.resolveKey(k));
    const values = await this.provider.mget<T>(fullKeys);
    const result = new Map<string, T | null>();

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (key !== undefined) {
        result.set(key, values[i] ?? null);
      }
    }

    return result;
  }

  async mset<T>(entries: Array<{ key: string; value: T }>, policy?: CachePolicyInterface): Promise<void> {
    const fullEntries = entries.map((e) => ({
      key: this.resolveKey(e.key),
      value: e.value,
    }));

    await this.provider.mset(fullEntries, {
      policy: policy ?? CachePolicy.defaultTTL(),
    });
  }

  async mdelete(keys: string[]): Promise<number> {
    const fullKeys = keys.map((k) => this.resolveKey(k));

    return this.provider.mdelete(fullKeys);
  }

  async clear(): Promise<void> {
    if (this.prefix) {
      await this.provider.clearByPrefix(this.prefix);
    } else {
      await this.provider.clear();
    }
  }

  child(prefix: string): CacheManager {
    const combined = this.prefix ? `${this.prefix}:${prefix}` : prefix;

    return new CacheManager(this.provider, { prefix: combined });
  }

  private resolveKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  private async hasSlidingPolicy(key: string): Promise<boolean> {
    if (!this.provider.getPolicy) {
      return false;
    }

    const policy = await this.provider.getPolicy(key);

    return policy?.type === "sliding";
  }
}
