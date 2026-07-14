import type { CacheProvider, SetCacheOptions, CachePolicy } from "./types.js";

export class NoopCacheProvider implements CacheProvider {
  private store = new Map<string, unknown>();
  private expirations = new Map<string, number>();
  private policies = new Map<string, CachePolicy>();
  private keysByPrefix = new Map<string, Set<string>>();

  async get<T>(key: string): Promise<T | null> {
    if (this.isExpired(key)) {
      this.store.delete(key);
      this.expirations.delete(key);
      this.policies.delete(key);

      return null;
    }

    const value = this.store.get(key) as T | undefined;

    if (value === undefined) {
      return null;
    }

    return value;
  }

  async set<T>(key: string, value: T, options?: SetCacheOptions): Promise<void> {
    this.store.set(key, value);

    const policy = options?.policy;

    if (policy) {
      this.policies.set(key, policy);

      if (policy.type !== "none" && (policy.ttlMs ?? policy.slidingWindowMs)) {
        const ttl = policy.ttlMs ?? policy.slidingWindowMs ?? 300_000;

        this.expirations.set(key, Date.now() + ttl);
      }
    } else {
      this.expirations.set(key, Date.now() + 300_000);
    }

    const prefix = this.extractPrefix(key);

    if (!this.keysByPrefix.has(prefix)) {
      this.keysByPrefix.set(prefix, new Set());
    }

    this.keysByPrefix.get(prefix)!.add(key);
  }

  async delete(key: string): Promise<boolean> {
    const existed = this.store.has(key);

    this.store.delete(key);
    this.expirations.delete(key);
    this.policies.delete(key);

    const prefix = this.extractPrefix(key);

    this.keysByPrefix.get(prefix)?.delete(key);

    return existed;
  }

  async exists(key: string): Promise<boolean> {
    if (this.isExpired(key)) {
      this.store.delete(key);
      this.expirations.delete(key);
      this.policies.delete(key);

      return false;
    }

    return this.store.has(key);
  }

  async expire(key: string, ttlMs: number): Promise<boolean> {
    if (!this.store.has(key)) {
      return false;
    }

    this.expirations.set(key, Date.now() + ttlMs);

    return true;
  }

  async clearByPrefix(prefix: string): Promise<number> {
    const keysToDelete: string[] = [];

    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.store.delete(key);
      this.expirations.delete(key);
      this.policies.delete(key);
    }

    this.keysByPrefix.delete(prefix);

    return keysToDelete.length;
  }

  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    const results: Array<T | null> = [];

    for (const key of keys) {
      results.push(await this.get<T>(key));
    }

    return results;
  }

  async mset<T>(entries: Array<{ key: string; value: T }>, options?: SetCacheOptions): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, options);
    }
  }

  async mdelete(keys: string[]): Promise<number> {
    let count = 0;

    for (const key of keys) {
      const deleted = await this.delete(key);

      if (deleted) {
        count++;
      }
    }

    return count;
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.expirations.clear();
    this.policies.clear();
    this.keysByPrefix.clear();
  }

  async getPolicy(key: string): Promise<CachePolicy | null> {
    return this.policies.get(key) ?? null;
  }

  async touch(key: string, ttlMs: number): Promise<boolean> {
    if (!this.store.has(key)) {
      return false;
    }

    this.expirations.set(key, Date.now() + ttlMs);

    return true;
  }

  size(): number {
    this.evictExpired();

    return this.store.size;
  }

  private isExpired(key: string): boolean {
    const expiresAt = this.expirations.get(key);

    if (expiresAt === undefined) {
      return false;
    }

    return Date.now() >= expiresAt;
  }

  private evictExpired(): void {
    const now = Date.now();

    for (const [key, expiresAt] of this.expirations) {
      if (now >= expiresAt) {
        this.store.delete(key);
        this.expirations.delete(key);
        this.policies.delete(key);
      }
    }
  }

  private extractPrefix(key: string): string {
    const colonIndex = key.indexOf(":");

    if (colonIndex === -1) {
      return key;
    }

    return key.slice(0, colonIndex);
  }
}
