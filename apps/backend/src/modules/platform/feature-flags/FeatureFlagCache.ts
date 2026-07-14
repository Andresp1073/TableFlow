import type { CacheProvider, SetCacheOptions } from "../cache/types.js";
import type { FeatureFlag, FeatureFlagCacheConfig, FeatureFlagDecision } from "./types.js";

const DEFAULT_CACHE_TTL_MS = 60_000;
const FEATURE_FLAG_CACHE_PREFIX = "ff";

export class FeatureFlagCache {
  private readonly provider: CacheProvider;
  private readonly config: Required<FeatureFlagCacheConfig>;
  private readonly options?: SetCacheOptions;

  constructor(provider: CacheProvider, config?: FeatureFlagCacheConfig, options?: SetCacheOptions) {
    this.provider = provider;
    this.config = {
      ttlMs: config?.ttlMs ?? DEFAULT_CACHE_TTL_MS,
      enabled: config?.enabled ?? true,
    };
    this.options = options;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  private flagKey(key: string): string {
    return `${FEATURE_FLAG_CACHE_PREFIX}:flag:${key}`;
  }

  private decisionKey(key: string, contextHash: string): string {
    return `${FEATURE_FLAG_CACHE_PREFIX}:decision:${key}:${contextHash}`;
  }

  async getFlag(key: string): Promise<FeatureFlag | null> {
    if (!this.config.enabled) {
      return null;
    }

    return this.provider.get<FeatureFlag>(this.flagKey(key));
  }

  async setFlag(flag: FeatureFlag): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    await this.provider.set(this.flagKey(flag.key), flag, {
      ...this.options,
      policy: this.options?.policy ?? { type: "absolute", ttlMs: this.config.ttlMs },
    });
  }

  async getDecision(key: string, contextHash: string): Promise<FeatureFlagDecision | null> {
    if (!this.config.enabled) {
      return null;
    }

    return this.provider.get<FeatureFlagDecision>(this.decisionKey(key, contextHash));
  }

  async setDecision(decision: FeatureFlagDecision, contextHash: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    await this.provider.set(this.decisionKey(decision.key, contextHash), decision, {
      ...this.options,
      policy: this.options?.policy ?? { type: "absolute", ttlMs: this.config.ttlMs },
    });
  }

  async invalidateFlag(key: string): Promise<void> {
    await this.provider.delete(this.flagKey(key));
  }

  async invalidateAll(): Promise<void> {
    await this.provider.clearByPrefix(`${FEATURE_FLAG_CACHE_PREFIX}:`);
  }

  getConfig(): Required<FeatureFlagCacheConfig> {
    return { ...this.config };
  }
}
