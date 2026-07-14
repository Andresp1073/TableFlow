import type { CacheProvider, SetCacheOptions } from "../cache/types.js";
import type { ConfigValue } from "./types.js";

const CACHE_PREFIX = "config:";
const DEFAULT_TTL_MS = 60_000;

export class ConfigurationCache {
  private readonly cache: CacheProvider;
  private readonly ttlMs: number;

  constructor(cache: CacheProvider, options?: SetCacheOptions) {
    this.cache = cache;

    const ttl = options?.policy?.ttlMs ?? options?.policy?.slidingWindowMs ?? DEFAULT_TTL_MS;

    this.ttlMs = ttl;
  }

  async get(key: string): Promise<ConfigValue | undefined> {
    const value = await this.cache.get<ConfigValue>(this.cacheKey(key));

    return value ?? undefined;
  }

  async set(key: string, value: ConfigValue): Promise<void> {
    await this.cache.set(this.cacheKey(key), value, {
      policy: { type: "absolute", ttlMs: this.ttlMs },
    });
  }

  async has(key: string): Promise<boolean> {
    return this.cache.exists(this.cacheKey(key));
  }

  async invalidate(key: string): Promise<void> {
    await this.cache.delete(this.cacheKey(key));
  }

  async invalidateMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.cache.delete(this.cacheKey(key));
    }
  }

  async invalidateAll(): Promise<void> {
    await this.cache.clearByPrefix(CACHE_PREFIX);
  }

  private cacheKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }
}
