import type { CacheStats } from "./CacheStats.js";

export interface CacheProvider {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  deleteByPattern(pattern: string): Promise<number>;
  exists(key: string): Promise<boolean>;
  getStats(): CacheStats;
  dispose(): void;
}
