import type {
  RateLimitCounter as RateLimitCounterInterface,
  RateLimitWindowData,
  TokenBucketData,
  LeakyBucketData,
  CacheProvider,
} from "./types.js";

export class RateLimitCounter implements RateLimitCounterInterface {
  constructor(private readonly cache: CacheProvider) {}

  async increment(key: string, ttlMs: number): Promise<number> {
    const cacheKey = this.counterKey(key);
    const existing = await this.cache.get<number>(cacheKey);
    const value = (existing ?? 0) + 1;

    await this.cache.set(cacheKey, value, { policy: { type: "absolute", ttlMs } });

    return value;
  }

  async get(key: string): Promise<number> {
    const cacheKey = this.counterKey(key);
    const value = await this.cache.get<number>(cacheKey);

    return value ?? 0;
  }

  async reset(key: string): Promise<void> {
    await this.cache.delete(this.counterKey(key));
    await this.cache.delete(this.windowKey(key));
    await this.cache.delete(this.tokenKey(key));
    await this.cache.delete(this.leakyKey(key));
  }

  async getWindow(key: string): Promise<RateLimitWindowData | null> {
    return this.cache.get<RateLimitWindowData>(this.windowKey(key));
  }

  async setWindow(key: string, data: RateLimitWindowData, ttlMs: number): Promise<void> {
    await this.cache.set(this.windowKey(key), data, { policy: { type: "absolute", ttlMs } });
  }

  async getTokenBucket(key: string): Promise<TokenBucketData | null> {
    return this.cache.get<TokenBucketData>(this.tokenKey(key));
  }

  async setTokenBucket(key: string, data: TokenBucketData, ttlMs: number): Promise<void> {
    await this.cache.set(this.tokenKey(key), data, { policy: { type: "absolute", ttlMs } });
  }

  async getLeakyBucket(key: string): Promise<LeakyBucketData | null> {
    return this.cache.get<LeakyBucketData>(this.leakyKey(key));
  }

  async setLeakyBucket(key: string, data: LeakyBucketData, ttlMs: number): Promise<void> {
    await this.cache.set(this.leakyKey(key), data, { policy: { type: "absolute", ttlMs } });
  }

  private counterKey(key: string): string {
    return `${key}:counter`;
  }

  private windowKey(key: string): string {
    return `${key}:window`;
  }

  private tokenKey(key: string): string {
    return `${key}:token`;
  }

  private leakyKey(key: string): string {
    return `${key}:leaky`;
  }
}
