import type {
  ConfigurationManager as ConfigurationManagerInterface,
  ConfigurationProvider as ConfigurationProviderInterface,
  ConfigurationChangeListener,
  ConfigurationManagerOptions,
  ConfigSource,
  ConfigSchema,
  ConfigValue,
  ConfigChangeEvent,
  ConfigReloadEvent,
  ConfigValidationError,
  Logger,
  EventPublisher,
  ConfigEvent,
} from "./types.js";
import { ConfigurationValidator } from "./ConfigurationValidator.js";
import { ConfigurationCache } from "./ConfigurationCache.js";
import { coerceValue } from "./ConfigValue.js";
import { InMemorySource } from "./sources/InMemorySource.js";

const DEFAULT_SOURCE_PRIORITY = [
  { name: "overrides", priority: 0 },
  { name: "environment", priority: 10 },
  { name: "defaults", priority: 100 },
];

export class ConfigurationManager implements ConfigurationManagerInterface {
  readonly provider: ConfigurationProviderInterface;
  private readonly sources: Map<string, ConfigSource> = new Map();
  private readonly schemas: Map<string, ConfigSchema> = new Map();
  private readonly listeners: Map<string, ConfigurationChangeListener> = new Map();
  private readonly validator: ConfigurationValidator;
  private cache?: ConfigurationCache;
  private logger?: Logger;
  private eventPublisher?: EventPublisher;

  constructor(options?: ConfigurationManagerOptions) {
    this.validator = new ConfigurationValidator();
    this.provider = this.createProvider();

    if (options?.sources) {
      for (const source of options.sources) {
        this.sources.set(source.name, source);
      }
    }

    if (options?.schemas) {
      this.registerSchemas(options.schemas);
    }

    if (options?.logger) {
      this.logger = options.logger;
    }

    if (options?.eventPublisher) {
      this.eventPublisher = options.eventPublisher;
    }

    if (options?.cacheProvider) {
      this.cache = new ConfigurationCache(options.cacheProvider, options.cacheOptions);
    }
  }

  addSource(source: ConfigSource): void {
    this.sources.set(source.name, source);
    this.logger?.info(`Configuration source added: ${source.name}`, { priority: source.priority });
  }

  removeSource(name: string): void {
    this.sources.delete(name);
    this.logger?.info(`Configuration source removed: ${name}`);
  }

  getSources(): ConfigSource[] {
    return Array.from(this.sources.values());
  }

  registerListener(listener: ConfigurationChangeListener): void {
    this.listeners.set(listener.name, listener);
  }

  unregisterListener(name: string): void {
    this.listeners.delete(name);
  }

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  setEventPublisher(publisher: EventPublisher): void {
    this.eventPublisher = publisher;
  }

  setCacheProvider(provider: import("../cache/types.js").CacheProvider, options?: import("../cache/types.js").SetCacheOptions): void {
    this.cache = new ConfigurationCache(provider, options);
  }

  registerSchema(schema: ConfigSchema): void {
    this.schemas.set(schema.key, schema);
    this.validator.registerSchema(schema);
  }

  registerSchemas(schemas: ConfigSchema[]): void {
    for (const schema of schemas) {
      this.schemas.set(schema.key, schema);
    }

    this.validator.registerSchemas(schemas);
  }

  private createProvider(): ConfigurationProviderInterface {
    const manager = this;

    return {
      async get<T extends ConfigValue>(key: string): Promise<T | undefined> {
        return manager.getConfig<T>(key);
      },

      async getRequired<T extends ConfigValue>(key: string): Promise<T> {
        const value = await manager.getConfig<T>(key);

        if (value === undefined) {
          throw new Error(`Required configuration "${key}" is not set`);
        }

        return value;
      },

      async getOrDefault<T extends ConfigValue>(key: string, defaultValue: T): Promise<T> {
        const value = await manager.getConfig<T>(key);

        return value ?? defaultValue;
      },

      async getMany<T extends ConfigValue>(keys: string[]): Promise<Map<string, T>> {
        const result = new Map<string, T>();

        for (const key of keys) {
          const value = await manager.getConfig<T>(key);

          if (value !== undefined) {
            result.set(key, value);
          }
        }

        return result;
      },

      async getAll(): Promise<Map<string, ConfigValue>> {
        const result = new Map<string, ConfigValue>();
        const sortedSources = manager.getSortedSources().reverse();

        for (const source of sortedSources) {
          const values = await source.getAll();

          for (const [key, value] of values) {
            result.set(key, value);
          }
        }

        for (const [key, schema] of manager.schemas) {
          if (!result.has(key) && schema.defaultValue !== undefined) {
            result.set(key, schema.defaultValue);
          }
        }

        return result;
      },

      async has(key: string): Promise<boolean> {
        const value = await manager.getConfig(key);

        return value !== undefined;
      },

      async refresh(key: string): Promise<void> {
        await manager.cache?.invalidate(key);

        const value = await manager.getConfig(key);

        if (value !== undefined) {
          const event: ConfigChangeEvent = {
            key,
            newValue: value,
            source: "refresh",
            timestamp: new Date(),
          };

          await manager.notifyChanged(event);
        }
      },

      async refreshAll(): Promise<void> {
        await manager.cache?.invalidateAll();
        await manager.notifyReloaded("refresh");
      },

      registerSchema(schema: ConfigSchema): void {
        manager.registerSchema(schema);
      },

      registerSchemas(schemas: ConfigSchema[]): void {
        manager.registerSchemas(schemas);
      },

      getSchema(key: string): ConfigSchema | undefined {
        return manager.schemas.get(key);
      },

      async getTyped<T extends ConfigValue>(key: string, type: import("./types.js").ConfigValueType): Promise<T | undefined> {
        const value = await manager.getConfig(key);

        if (value === undefined) {
          return undefined;
        }

        return coerceValue(value, type) as T | undefined;
      },

      async asString(key: string): Promise<string | undefined> {
        return manager.getConfig<string>(key);
      },

      async asNumber(key: string): Promise<number | undefined> {
        const value = await manager.getConfig(key);

        if (typeof value === "number") { return value; }

        if (typeof value === "string") {
          const num = Number(value);

          return Number.isNaN(num) ? undefined : num;
        }

        return undefined;
      },

      async asBoolean(key: string): Promise<boolean | undefined> {
        const value = await manager.getConfig(key);

        if (typeof value === "boolean") { return value; }

        if (typeof value === "string") {
          if (["true", "1", "yes", "on"].includes(value.toLowerCase())) { return true; }
          if (["false", "0", "no", "off"].includes(value.toLowerCase())) { return false; }
        }

        return undefined;
      },

      async asDuration(key: string): Promise<import("./types.js").DurationConfig | undefined> {
        const value = await manager.getConfig<import("./types.js").DurationConfig>(key);

        if (value && typeof value === "object" && "value" in value && "unit" in value) {
          return value as import("./types.js").DurationConfig;
        }

        return undefined;
      },

      async asArray(key: string): Promise<unknown[] | undefined> {
        const value = await manager.getConfig(key);

        return Array.isArray(value) ? value : undefined;
      },

      async asObject(key: string): Promise<Record<string, unknown> | undefined> {
        const value = await manager.getConfig(key);

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          return value as Record<string, unknown>;
        }

        return undefined;
      },
    };
  }

  private async getConfig<T extends ConfigValue = ConfigValue>(key: string): Promise<T | undefined> {
    if (this.cache) {
      const cached = await this.cache.get(key);

      if (cached !== undefined) {
        return cached as T;
      }
    }

    const sortedSources = this.getSortedSources();

    for (const source of sortedSources) {
      const value = await source.get(key);

      if (value !== undefined) {
        const schema = this.schemas.get(key);

        if (schema) {
          const coerced = coerceValue(value, schema.type);

          if (coerced !== undefined) {
            if (this.cache) {
              await this.cache.set(key, coerced as ConfigValue);
            }

            return coerced as T;
          }
        }

        if (this.cache) {
          await this.cache.set(key, value);
        }

        return value as T;
      }
    }

    const schema = this.schemas.get(key);

    if (schema && schema.defaultValue !== undefined) {
      return schema.defaultValue as T;
    }

    return undefined;
  }

  private getSortedSources(): ConfigSource[] {
    return Array.from(this.sources.values())
      .filter((s) => s.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  private async notifyChanged(event: ConfigChangeEvent): Promise<void> {
    const configEvent: ConfigEvent = {
      type: "configuration_changed",
      key: event.key,
      oldValue: event.oldValue,
      newValue: event.newValue,
      source: event.source,
      timestamp: event.timestamp,
      metadata: { source: "ConfigurationManager" },
    };

    await this.publishEvent(configEvent);

    for (const listener of this.listeners.values()) {
      try {
        await listener.onConfigChanged(event);
      } catch (error) {
        this.logger?.error("Configuration change listener failed", {
          listener: listener.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  private async notifyReloaded(source: string): Promise<void> {
    const event: ConfigReloadEvent = {
      source,
      changedKeys: [],
      timestamp: new Date(),
    };

    const configEvent: ConfigEvent = {
      type: "configuration_reloaded",
      source,
      timestamp: event.timestamp,
      metadata: { source: "ConfigurationManager" },
    };

    await this.publishEvent(configEvent);

    for (const listener of this.listeners.values()) {
      try {
        await listener.onConfigReloaded(event);
      } catch (error) {
        this.logger?.error("Configuration reload listener failed", {
          listener: listener.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  private async notifyValidationFailed(errors: ConfigValidationError[]): Promise<void> {
    const configEvent: ConfigEvent = {
      type: "configuration_validation_failed",
      errors,
      timestamp: new Date(),
      metadata: { source: "ConfigurationManager", errorCount: errors.length },
    };

    await this.publishEvent(configEvent);

    for (const listener of this.listeners.values()) {
      try {
        await listener.onValidationFailed(errors);
      } catch (error) {
        this.logger?.error("Validation failure listener failed", {
          listener: listener.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  private async publishEvent(event: ConfigEvent): Promise<void> {
    if (!this.eventPublisher) {
      return;
    }

    try {
      await this.eventPublisher.publish({
        id: `cfg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: event.type,
        occurredAt: event.timestamp,
        metadata: {
          correlationId: "",
          version: 1,
          timestamp: event.timestamp.toISOString(),
          source: "ConfigurationManager",
          custom: event.metadata,
        },
        payload: {
          key: event.key,
          keys: event.keys,
          errors: event.errors,
          source: event.source,
          oldValue: event.oldValue,
          newValue: event.newValue,
        },
      });
    } catch (error) {
      this.logger?.error("Failed to publish configuration event", {
        error: error instanceof Error ? error.message : String(error),
        eventType: event.type,
      });
    }
  }
}
