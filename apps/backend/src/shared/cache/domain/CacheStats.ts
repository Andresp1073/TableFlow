export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletions: number;
  invalidations: number;
  entries: number;
  estimatedSize: number;
  hitRate: number;
}
