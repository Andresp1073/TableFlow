export interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  createdAt: number;
  size: number;
}
