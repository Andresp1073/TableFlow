import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";
import type { CacheProvider, SetCacheOptions } from "../cache/types.js";

export type FlagValueType = "boolean" | "string" | "number";

export type FlagValue = boolean | string | number;

export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  tags?: string[];
  type: FlagValueType;
  defaultValue: FlagValue;
  rules: FeatureFlagRuleConfig[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface FeatureFlagContext {
  environment?: string;
  tenantId?: string;
  restaurantId?: string;
  userId?: string;
  roles?: string[];
  permissions?: string[];
  apiClientId?: string;
  requestMetadata?: Record<string, unknown>;
  evaluatedAt: Date;
}

export type RuleType =
  | "boolean"
  | "percentage"
  | "date"
  | "role"
  | "tenant"
  | "restaurant"
  | "composite";

export type CompositeOperator = "AND" | "OR" | "NOT";

export type DateCondition = "before" | "after" | "between";

export interface BaseRuleConfig {
  type: RuleType;
  priority: number;
}

export interface BooleanRuleConfig extends BaseRuleConfig {
  type: "boolean";
  value: boolean;
}

export interface PercentageRuleConfig extends BaseRuleConfig {
  type: "percentage";
  percentage: number;
  sticky?: boolean;
  entityField?: keyof FeatureFlagContext;
}

export interface DateRuleConfig extends BaseRuleConfig {
  type: "date";
  condition: DateCondition;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export interface RoleRuleConfig extends BaseRuleConfig {
  type: "role";
  roles: string[];
  mode: "allow" | "deny";
}

export interface TenantRuleConfig extends BaseRuleConfig {
  type: "tenant";
  tenantIds: string[];
  mode: "allow" | "deny";
}

export interface RestaurantRuleConfig extends BaseRuleConfig {
  type: "restaurant";
  restaurantIds: string[];
  mode: "allow" | "deny";
}

export interface CompositeRuleConfig extends BaseRuleConfig {
  type: "composite";
  operator: CompositeOperator;
  rules: FeatureFlagRuleConfig[];
}

export type FeatureFlagRuleConfig =
  | BooleanRuleConfig
  | PercentageRuleConfig
  | DateRuleConfig
  | RoleRuleConfig
  | TenantRuleConfig
  | RestaurantRuleConfig
  | CompositeRuleConfig;

export interface FeatureFlagDecision {
  key: string;
  enabled: boolean;
  value: FlagValue;
  reason: string;
  matchedRule?: FeatureFlagRuleConfig;
  evaluatedAt: Date;
  context: Partial<FeatureFlagContext>;
}

export type FeatureFlagEventType =
  | "feature_flag.evaluated"
  | "feature_flag.changed"
  | "feature_flag.rollout_started"
  | "feature_flag.validation_failed";

export interface FeatureFlagEvent {
  type: FeatureFlagEventType;
  flagKey: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagCacheConfig {
  ttlMs: number;
  enabled: boolean;
}

export interface FeatureFlagProvider {
  isEnabled(key: string, context?: Partial<FeatureFlagContext>): Promise<boolean>;
  getValue<T extends FlagValue>(key: string, context?: Partial<FeatureFlagContext>): Promise<T>;
  evaluate(key: string, context?: Partial<FeatureFlagContext>): Promise<FeatureFlagDecision>;
  getFlag(key: string): Promise<FeatureFlag | null>;
  getAllFlags(): Promise<FeatureFlag[]>;
}

export interface FeatureFlagManagerInterface {
  readonly provider: FeatureFlagProvider;
  registerFlag(flag: FeatureFlag): FeatureFlag;
  updateFlag(key: string, updates: Partial<FeatureFlag>): void;
  deleteFlag(key: string): void;
  getFlag(key: string): FeatureFlag | null;
  getAllFlags(): FeatureFlag[];
  evaluate(key: string, context?: Partial<FeatureFlagContext>): Promise<FeatureFlagDecision>;
  setLogger(logger: Logger): void;
  setEventPublisher(publisher: EventPublisher): void;
  setCacheProvider(provider: CacheProvider, config?: FeatureFlagCacheConfig, options?: SetCacheOptions): void;
}
