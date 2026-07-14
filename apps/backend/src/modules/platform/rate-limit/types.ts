import type { CacheProvider } from "../cache/types.js";
import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";

export type RateLimitStrategyType = "fixed_window" | "sliding_window" | "token_bucket" | "leaky_bucket" | "adaptive";

export type LimitDimension = "user" | "role" | "restaurant" | "tenant" | "api_key" | "ip" | "endpoint";

export interface RateLimitContext {
  userId?: string;
  role?: string;
  restaurantId?: string;
  tenantId?: string;
  apiKey?: string;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
  policyName?: string;
  metadata: Record<string, unknown>;
}

export interface RateLimitPolicyConfig {
  name: string;
  strategy: RateLimitStrategyType;
  maxRequests: number;
  windowMs: number;
  burstMultiplier?: number;
  dimensions: LimitDimension[];
  enabled: boolean;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetTime: Date;
  retryAfterMs: number;
  policyName: string;
  strategy: RateLimitStrategyType;
}

export interface RateLimitWindowData {
  count: number;
  windowStart: number;
  expiresAt: number;
}

export interface TokenBucketData {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number;
}

export interface LeakyBucketData {
  water: number;
  lastLeak: number;
  capacity: number;
  leakRate: number;
}

export type StrategyData = RateLimitWindowData | TokenBucketData | LeakyBucketData;

export interface RateLimitCounter {
  increment(key: string, ttlMs: number): Promise<number>;
  get(key: string): Promise<number>;
  reset(key: string): Promise<void>;
  getWindow(key: string): Promise<RateLimitWindowData | null>;
  setWindow(key: string, data: RateLimitWindowData, ttlMs: number): Promise<void>;
  getTokenBucket(key: string): Promise<TokenBucketData | null>;
  setTokenBucket(key: string, data: TokenBucketData, ttlMs: number): Promise<void>;
  getLeakyBucket(key: string): Promise<LeakyBucketData | null>;
  setLeakyBucket(key: string, data: LeakyBucketData, ttlMs: number): Promise<void>;
}

export interface RateLimitStrategy {
  readonly type: RateLimitStrategyType;
  check(key: string, counter: RateLimitCounter, policy: RateLimitPolicyConfig): Promise<RateLimitDecision>;
}

export interface RateLimitKeyResolver {
  resolve(context: RateLimitContext, dimensions: LimitDimension[]): string;
}

export interface RateLimitEngine {
  evaluate(context: RateLimitContext): Promise<RateLimitDecision>;
  registerPolicy(policy: RateLimitPolicyConfig): void;
  getPolicy(name: string): RateLimitPolicyConfig | undefined;
  reset(context: RateLimitContext): Promise<void>;
}

export interface RateLimitEngineOptions {
  strategies: RateLimitStrategy[];
  keyResolver: RateLimitKeyResolver;
  counter: RateLimitCounter;
  policies: RateLimitPolicyConfig[];
  logger?: Logger;
  eventPublisher?: EventPublisher;
  metrics?: RateLimitMetricsCollector;
}

export interface RateLimitMetricsCollector {
  incrementAccepted(policyName: string): void;
  incrementRejected(policyName: string): void;
  incrementPolicyUsage(policyName: string): void;
  incrementRetry(policyName: string): void;
  setRateLimitRemaining(policyName: string, remaining: number): void;
}

export interface RateLimitEvent {
  type: "rate_limit_exceeded" | "suspicious_traffic_detected";
  context: RateLimitContext;
  decision: RateLimitDecision;
  timestamp: Date;
  metadata: Record<string, unknown>;
}
