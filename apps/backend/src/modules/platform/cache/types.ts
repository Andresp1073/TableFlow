export type CacheExpirationType = "absolute" | "sliding" | "none" | "custom";

export interface CachePolicy {
  type: CacheExpirationType;
  ttlMs?: number;
  slidingWindowMs?: number;
}

export interface SetCacheOptions {
  policy?: CachePolicy;
}

export interface CachedEntry<T> {
  value: T;
  expiresAt: number | null;
  slidingWindowMs: number | null;
  createdAt: number;
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: SetCacheOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttlMs: number): Promise<boolean>;
  clearByPrefix(prefix: string): Promise<number>;
  mget<T>(keys: string[]): Promise<Array<T | null>>;
  mset<T>(entries: Array<{ key: string; value: T }>, options?: SetCacheOptions): Promise<void>;
  mdelete(keys: string[]): Promise<number>;
  clear(): Promise<void>;
  getPolicy?(key: string): Promise<CachePolicy | null>;
  touch?(key: string, ttlMs: number): Promise<boolean>;
}

export type InvalidationStrategy = "entity" | "module" | "pattern" | "dependency";

export interface InvalidationRule {
  name: string;
  strategy: InvalidationStrategy;
  entityType?: string;
  module?: string;
  pattern?: string;
  dependencies?: Array<{ entityType: string; relationship: string }>;
  priority: number;
  getKeys(context: InvalidationContext): string[];
}

export interface InvalidationContext {
  entityType?: string;
  entityId?: string;
  module?: string;
  pattern?: string;
  metadata?: Record<string, unknown>;
}

export interface CacheInvalidationResult {
  success: boolean;
  invalidatedKeys: number;
  rulesApplied: number;
  errors: string[];
  duration: number;
}

export interface KeyTemplate {
  template: string;
  description?: string;
}

export type KeyPattern = string;

export interface EntityKeyTemplate {
  entityType: string;
  template: string;
}
