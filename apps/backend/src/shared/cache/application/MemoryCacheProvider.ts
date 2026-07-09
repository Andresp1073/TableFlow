import type { CacheEntry } from "../domain/CacheEntry.js";
import type { CacheProvider } from "../domain/CacheProvider.js";
import type { CacheStats } from "../domain/CacheStats.js";

export interface MemoryCacheProviderOptions {
  defaultTtlMs?: number;
  sweepIntervalMs?: number;
  maxEntries?: number;
}

export class MemoryCacheProvider implements CacheProvider {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtlMs: number;
  private readonly maxEntries: number;
  private sweepTimer: ReturnType<typeof setInterval> | null = null;

  private hits = 0;
  private misses = 0;
  private sets = 0;
  private deletions = 0;
  private invalidations = 0;

  constructor(options?: MemoryCacheProviderOptions) {
    this.defaultTtlMs = options?.defaultTtlMs ?? 300_000;
    this.maxEntries = options?.maxEntries ?? 10_000;

    const sweepMs = options?.sweepIntervalMs ?? 60_000;
    this.sweepTimer = setInterval(() => this.sweep(), sweepMs);
    if (typeof this.sweepTimer === "object" && typeof this.sweepTimer.unref === "function") {
      this.sweepTimer.unref();
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      this.deletions++;
      return undefined;
    }

    this.hits++;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.evictOne();
    }

    const ttl = ttlMs ?? this.defaultTtlMs;
    const expiresAt = ttl > 0 ? Date.now() + ttl : null;

    this.store.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
      size: estimateSize(value),
    });

    this.sets++;
  }

  async delete(key: string): Promise<boolean> {
    const existed = this.store.delete(key);
    if (existed) {
      this.deletions++;
    }
    return existed;
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
    this.sets = 0;
    this.deletions = 0;
    this.invalidations = 0;
  }

  async deleteByPattern(pattern: string): Promise<number> {
    const regex = patternToRegex(pattern);
    let count = 0;

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.deletions += count;
      this.invalidations += count;
    }

    return count;
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);

    if (!entry) {
      return false;
    }

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.deletions++;
      return false;
    }

    return true;
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total === 0 ? 0 : this.hits / total;

    let estimatedSize = 0;
    for (const entry of this.store.values()) {
      estimatedSize += entry.size;
    }

    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      deletions: this.deletions,
      invalidations: this.invalidations,
      entries: this.store.size,
      estimatedSize,
      hitRate,
    };
  }

  dispose(): void {
    if (this.sweepTimer !== null) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
    this.store.clear();
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.store.delete(key);
        this.deletions++;
      }
    }
  }

  private evictOne(): void {
    const now = Date.now();
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt !== null && now >= entry.expiresAt) {
        this.store.delete(key);
        this.deletions++;
        return;
      }

      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      this.store.delete(oldestKey);
      this.deletions++;
    }
  }
}

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const regexStr = escaped.replace(/\*/g, ".*");
  return new RegExp(`^${regexStr}$`);
}

function estimateSize(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "boolean") {
    return 4;
  }

  if (typeof value === "number") {
    return 8;
  }

  if (typeof value === "string") {
    return value.length * 2;
  }

  if (value instanceof Set) {
    let size = 0;
    for (const item of value) {
      size += estimateSize(item);
    }
    return size;
  }

  if (value instanceof Map) {
    let size = 0;
    for (const [k, v] of value) {
      size += estimateSize(k) + estimateSize(v);
    }
    return size;
  }

  if (Array.isArray(value)) {
    let size = 0;
    for (const item of value) {
      size += estimateSize(item);
    }
    return size;
  }

  if (typeof value === "object") {
    let size = 0;
    const obj = value as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      size += key.length * 2 + estimateSize(obj[key]);
    }
    return size;
  }

  return 0;
}
