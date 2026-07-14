import type {
  FeatureFlagManagerInterface,
  FeatureFlagProvider,
  FeatureFlag,
  FeatureFlagContext,
  FeatureFlagDecision,
  FeatureFlagCacheConfig,
  FlagValue,
  FlagValueType,
  Logger,
  EventPublisher,
} from "./types.js";
import type { CacheProvider, SetCacheOptions } from "../cache/types.js";
import { FeatureFlagEvaluator } from "./FeatureFlagEvaluator.js";
import { FeatureFlagCache } from "./FeatureFlagCache.js";
import { createFeatureFlagContext, mergeContext } from "./FeatureFlagContext.js";
import { publishFeatureFlagEvent } from "./events.js";
import {
  FeatureFlagNotFoundError,
  FeatureFlagValidationError,
} from "./errors.js";

export class FeatureFlagManager implements FeatureFlagManagerInterface {
  readonly provider: FeatureFlagProvider;
  private readonly flags: Map<string, FeatureFlag> = new Map();
  private readonly evaluator: FeatureFlagEvaluator;
  private cache?: FeatureFlagCache;
  private logger?: Logger;
  private eventPublisher?: EventPublisher;

  constructor() {
    this.evaluator = new FeatureFlagEvaluator();
    this.provider = this.createProvider();
  }

  registerFlag(flag: FeatureFlag): FeatureFlag {
    const errors = this.validateFlag(flag);

    if (errors.length > 0) {
      throw new FeatureFlagValidationError(flag.key, errors);
    }

    const now = new Date();
    const stored: FeatureFlag = {
      ...flag,
      createdAt: flag.createdAt ?? now,
      updatedAt: now,
      version: flag.version ?? 1,
    };

    this.flags.set(flag.key, stored);

    if (this.cache) {
      this.cache.setFlag(stored).catch((error) => {
        this.logger?.error("Failed to cache feature flag", {
          flagKey: flag.key,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }

    this.logger?.info(`Feature flag registered: ${flag.key}`, {
      type: flag.type,
      enabled: flag.enabled,
      rulesCount: flag.rules.length,
    });

    return stored;
  }

  updateFlag(key: string, updates: Partial<FeatureFlag>): void {
    const existing = this.flags.get(key);

    if (!existing) {
      throw new FeatureFlagNotFoundError(key);
    }

    const previousEnabled = existing.enabled;
    const updated: FeatureFlag = {
      ...existing,
      ...updates,
      key,
      updatedAt: new Date(),
      version: existing.version + 1,
    };

    const errors = this.validateFlag(updated);

    if (errors.length > 0) {
      throw new FeatureFlagValidationError(key, errors);
    }

    this.flags.set(key, updated);

    if (this.cache) {
      this.cache.invalidateFlag(key).catch((error) => {
        this.logger?.error("Failed to invalidate cache on flag update", {
          flagKey: key,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }

    this.logger?.info(`Feature flag updated: ${key}`, {
      previousEnabled,
      newEnabled: updated.enabled,
      version: updated.version,
    });

    publishFeatureFlagEvent(
      this.eventPublisher,
      this.logger,
      "feature_flag.changed",
      key,
      {
        previousEnabled,
        newEnabled: updated.enabled,
        version: updated.version,
        updatedFields: Object.keys(updates),
      },
    );

    if (!previousEnabled && updated.enabled) {
      publishFeatureFlagEvent(
        this.eventPublisher,
        this.logger,
        "feature_flag.rollout_started",
        key,
        { version: updated.version },
      );
    }
  }

  deleteFlag(key: string): void {
    if (!this.flags.has(key)) {
      throw new FeatureFlagNotFoundError(key);
    }

    this.flags.delete(key);

    if (this.cache) {
      this.cache.invalidateFlag(key).catch((error) => {
        this.logger?.error("Failed to invalidate cache on flag delete", {
          flagKey: key,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }

    this.logger?.info(`Feature flag deleted: ${key}`);
  }

  getFlag(key: string): FeatureFlag | null {
    return this.flags.get(key) ?? null;
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  async evaluate(
    key: string,
    context?: Partial<FeatureFlagContext>,
  ): Promise<FeatureFlagDecision> {
    const flag = this.flags.get(key);

    if (!flag) {
      throw new FeatureFlagNotFoundError(key);
    }

    const fullContext = context
      ? mergeContext(createFeatureFlagContext(context), context)
      : createFeatureFlagContext();

    const contextHash = this.hashContext(fullContext);
    let decision: FeatureFlagDecision | null = null;

    if (this.cache) {
      decision = await this.cache.getDecision(key, contextHash);
    }

    if (!decision) {
      decision = this.evaluator.evaluate(flag, fullContext);

      if (this.cache) {
        await this.cache.setDecision(decision, contextHash);
      }
    }

    publishFeatureFlagEvent(
      this.eventPublisher,
      this.logger,
      "feature_flag.evaluated",
      key,
      {
        enabled: decision.enabled,
        reason: decision.reason,
        contextHash,
      },
    );

    return decision;
  }

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  setEventPublisher(publisher: EventPublisher): void {
    this.eventPublisher = publisher;
  }

  setCacheProvider(provider: CacheProvider, config?: FeatureFlagCacheConfig, options?: SetCacheOptions): void {
    this.cache = new FeatureFlagCache(provider, config, options);
  }

  private createProvider(): FeatureFlagProvider {
    const manager = this;

    return {
      async isEnabled(key: string, context?: Partial<FeatureFlagContext>): Promise<boolean> {
        const decision = await manager.evaluate(key, context);

        return decision.enabled;
      },

      async getValue<T extends FlagValue>(key: string, context?: Partial<FeatureFlagContext>): Promise<T> {
        const decision = await manager.evaluate(key, context);

        return decision.value as T;
      },

      async evaluate(key: string, context?: Partial<FeatureFlagContext>): Promise<FeatureFlagDecision> {
        return manager.evaluate(key, context);
      },

      async getFlag(key: string): Promise<FeatureFlag | null> {
        return manager.getFlag(key);
      },

      async getAllFlags(): Promise<FeatureFlag[]> {
        return manager.getAllFlags();
      },
    };
  }

  private validateFlag(flag: FeatureFlag): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];

    if (!flag.key || flag.key.trim().length === 0) {
      errors.push({ field: "key", message: "Flag key is required" });
    } else if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(flag.key)) {
      errors.push({ field: "key", message: "Flag key must start with a letter and contain only letters, numbers, dots, hyphens, and underscores" });
    }

    if (!flag.name || flag.name.trim().length === 0) {
      errors.push({ field: "name", message: "Flag name is required" });
    }

    if (!["boolean", "string", "number"].includes(flag.type)) {
      errors.push({ field: "type", message: `Invalid flag type: ${flag.type}` });
    }

    if (flag.defaultValue === undefined || flag.defaultValue === null) {
      errors.push({ field: "defaultValue", message: "Default value is required" });
    }

    if (flag.type === "boolean" && typeof flag.defaultValue !== "boolean") {
      errors.push({ field: "defaultValue", message: "Default value must be a boolean for boolean flags" });
    }

    if (flag.rules) {
      for (let i = 0; i < flag.rules.length; i++) {
        if (flag.rules[i].priority === undefined || flag.rules[i].priority === null) {
          errors.push({ field: `rules[${i}].priority`, message: "Rule priority is required" });
        }
      }
    }

    return errors;
  }

  private hashContext(context: FeatureFlagContext): string {
    const parts: string[] = [
      context.environment ?? "",
      context.tenantId ?? "",
      context.restaurantId ?? "",
      context.userId ?? "",
      ...(context.roles ?? []).sort(),
      ...(context.permissions ?? []).sort(),
      context.apiClientId ?? "",
    ];

    return parts.join("|");
  }
}
