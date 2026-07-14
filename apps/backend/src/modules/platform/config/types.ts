import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";
import type { CacheProvider, SetCacheOptions } from "../cache/types.js";

export type ConfigValueType = "string" | "number" | "boolean" | "duration" | "array" | "object" | "enum";

export type ConfigPrimitiveValue = string | number | boolean;

export interface DurationConfig {
  value: number;
  unit: "ms" | "s" | "m" | "h" | "d";
}

export type ConfigValue = ConfigPrimitiveValue | DurationConfig | unknown[] | Record<string, unknown>;

export interface ConfigSchema {
  key: string;
  type: ConfigValueType;
  required?: boolean;
  defaultValue?: ConfigValue;
  description?: string;
  tags?: string[];
  allowedValues?: ConfigPrimitiveValue[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enumValues?: string[];
  itemSchema?: ConfigSchema;
  properties?: Record<string, ConfigSchema>;
  secret?: boolean;
  mutable?: boolean;
  validator?: ConfigValidatorFn;
}

export type ConfigValidatorFn = (value: ConfigValue, schema: ConfigSchema) => ConfigValidationResult;

export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

export interface ConfigValidationError {
  key: string;
  message: string;
  code: ConfigValidationErrorCode;
  expected?: string;
  actual?: string;
}

export type ConfigValidationErrorCode =
  | "missing_required"
  | "type_mismatch"
  | "value_out_of_range"
  | "value_not_allowed"
  | "pattern_mismatch"
  | "min_length_exceeded"
  | "max_length_exceeded"
  | "custom_validation_failed"
  | "invalid_enum";

export interface ConfigSource {
  readonly name: string;
  readonly priority: number;
  readonly enabled: boolean;
  get(key: string): Promise<ConfigValue | undefined>;
  getMany(keys: string[]): Promise<Map<string, ConfigValue | undefined>>;
  has(key: string): Promise<boolean>;
  getAll(): Promise<Map<string, ConfigValue>>;
}

export interface ConfigChangeEvent {
  key: string;
  oldValue?: ConfigValue;
  newValue: ConfigValue;
  source: string;
  timestamp: Date;
}

export interface ConfigReloadEvent {
  source: string;
  changedKeys: string[];
  timestamp: Date;
}

export interface ConfigurationChangeListener {
  readonly name: string;
  onConfigChanged(event: ConfigChangeEvent): Promise<void>;
  onConfigReloaded(event: ConfigReloadEvent): Promise<void>;
  onValidationFailed(errors: ConfigValidationError[]): Promise<void>;
}

export interface ConfigurationProvider {
  get<T extends ConfigValue>(key: string): Promise<T | undefined>;
  getRequired<T extends ConfigValue>(key: string): Promise<T>;
  getOrDefault<T extends ConfigValue>(key: string, defaultValue: T): Promise<T>;
  getMany<T extends ConfigValue>(keys: string[]): Promise<Map<string, T>>;
  getAll(): Promise<Map<string, ConfigValue>>;
  has(key: string): Promise<boolean>;
  refresh(key: string): Promise<void>;
  refreshAll(): Promise<void>;
  registerSchema(schema: ConfigSchema): void;
  registerSchemas(schemas: ConfigSchema[]): void;
  getSchema(key: string): ConfigSchema | undefined;
  getTyped<T extends ConfigValue>(key: string, type: ConfigValueType): Promise<T | undefined>;
  asString(key: string): Promise<string | undefined>;
  asNumber(key: string): Promise<number | undefined>;
  asBoolean(key: string): Promise<boolean | undefined>;
  asDuration(key: string): Promise<DurationConfig | undefined>;
  asArray(key: string): Promise<unknown[] | undefined>;
  asObject(key: string): Promise<Record<string, unknown> | undefined>;
}

export interface ConfigurationManager {
  readonly provider: ConfigurationProvider;
  addSource(source: ConfigSource): void;
  removeSource(name: string): void;
  getSources(): ConfigSource[];
  registerListener(listener: ConfigurationChangeListener): void;
  unregisterListener(name: string): void;
  setLogger(logger: Logger): void;
  setEventPublisher(publisher: EventPublisher): void;
  setCacheProvider(provider: CacheProvider, options?: SetCacheOptions): void;
}

export interface ConfigurationManagerOptions {
  sources?: ConfigSource[];
  schemas?: ConfigSchema[];
  logger?: Logger;
  eventPublisher?: EventPublisher;
  cacheProvider?: CacheProvider;
  cacheOptions?: SetCacheOptions;
}

export type ConfigEventType = "configuration_changed" | "configuration_reloaded" | "configuration_validation_failed";

export interface ConfigEvent {
  type: ConfigEventType;
  key?: string;
  keys?: string[];
  errors?: ConfigValidationError[];
  source?: string;
  oldValue?: ConfigValue;
  newValue?: ConfigValue;
  timestamp: Date;
  metadata: Record<string, unknown>;
}
