import type { CacheProvider, SetCacheOptions } from "../cache/types.js";
import type { Secret, SecretCacheConfig, SecretPayload } from "./types.js";

const DEFAULT_CACHE_TTL_MS = 300_000;
const SECRETS_CACHE_PREFIX = "secret";

export class SecretCache {
  private readonly provider: CacheProvider;
  private readonly config: Required<SecretCacheConfig>;
  private readonly options?: SetCacheOptions;

  constructor(provider: CacheProvider, config?: SecretCacheConfig, options?: SetCacheOptions) {
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

  private buildKey(key: string): string {
    return `${SECRETS_CACHE_PREFIX}:${key}`;
  }

  async get(key: string): Promise<Secret | null> {
    if (!this.config.enabled) {
      return null;
    }

    const cacheKey = this.buildKey(key);

    return this.provider.get<Secret>(cacheKey);
  }

  async set(secret: Secret): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const cacheKey = this.buildKey(secret.metadata.key);

    await this.provider.set(cacheKey, secret, {
      ...this.options,
      policy: this.options?.policy ?? { type: "absolute", ttlMs: this.config.ttlMs },
    });
  }

  async invalidate(key: string): Promise<void> {
    const cacheKey = this.buildKey(key);

    await this.provider.delete(cacheKey);
  }

  async invalidateAll(): Promise<void> {
    await this.provider.clearByPrefix(`${SECRETS_CACHE_PREFIX}:`);
  }

  getConfig(): Required<SecretCacheConfig> {
    return { ...this.config };
  }

  async getOrFetch<T extends SecretPayload>(
    key: string,
    fetchFn: () => Promise<Secret | null>,
  ): Promise<Secret | null> {
    if (!this.config.enabled) {
      return fetchFn();
    }

    const cached = await this.get(key);

    if (cached) {
      return cached;
    }

    const secret = await fetchFn();

    if (secret) {
      await this.set(secret);
    }

    return secret;
  }
}
