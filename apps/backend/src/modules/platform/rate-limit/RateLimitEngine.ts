import type {
  RateLimitEngine as RateLimitEngineInterface,
  RateLimitContext,
  RateLimitPolicyConfig,
  RateLimitStrategy,
  RateLimitDecision,
  RateLimitCounter,
  RateLimitKeyResolver,
  RateLimitEngineOptions,
  RateLimitMetricsCollector,
} from "./types.js";
import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";

export class RateLimitEngine implements RateLimitEngineInterface {
  private readonly strategies: Map<string, RateLimitStrategy>;
  private readonly policies: Map<string, RateLimitPolicyConfig>;
  private readonly keyResolver: RateLimitKeyResolver;
  private readonly counter: RateLimitCounter;
  private readonly logger?: Logger;
  private readonly eventPublisher?: EventPublisher;
  private readonly metrics?: RateLimitMetricsCollector;

  constructor(options: RateLimitEngineOptions) {
    this.strategies = new Map(options.strategies.map((s) => [s.type, s]));
    this.policies = new Map(options.policies.map((p) => [p.name, p]));
    this.keyResolver = options.keyResolver;
    this.counter = options.counter;
    this.logger = options.logger;
    this.eventPublisher = options.eventPublisher;
    this.metrics = options.metrics;
  }

  async evaluate(context: RateLimitContext): Promise<RateLimitDecision> {
    const policy = this.resolvePolicy(context);

    if (!policy) {
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity,
        resetTime: new Date(Date.now() + 60_000),
        retryAfterMs: 0,
        policyName: "none",
        strategy: "fixed_window",
      };
    }

    if (!policy.enabled) {
      return {
        allowed: true,
        remaining: policy.maxRequests,
        limit: policy.maxRequests,
        resetTime: new Date(Date.now() + policy.windowMs),
        retryAfterMs: 0,
        policyName: policy.name,
        strategy: policy.strategy,
      };
    }

    const strategy = this.strategies.get(policy.strategy);

    if (!strategy) {
      this.logger?.warn(`No strategy registered for type: ${policy.strategy}`, { policyName: policy.name });

      return {
        allowed: true,
        remaining: policy.maxRequests,
        limit: policy.maxRequests,
        resetTime: new Date(Date.now() + policy.windowMs),
        retryAfterMs: 0,
        policyName: policy.name,
        strategy: policy.strategy,
      };
    }

    const key = this.keyResolver.resolve(context, policy.dimensions);

    this.metrics?.incrementPolicyUsage(policy.name);

    try {
      const decision = await strategy.check(key, this.counter, policy);

      if (!decision.allowed) {
        this.metrics?.incrementRejected(policy.name);
        this.metrics?.setRateLimitRemaining(policy.name, decision.remaining);
        this.publishRateLimitExceeded(context, decision);
      } else {
        this.metrics?.incrementAccepted(policy.name);
        this.metrics?.setRateLimitRemaining(policy.name, decision.remaining);
      }

      return decision;
    } catch (error) {
      this.logger?.error("Rate limit strategy evaluation failed", {
        policyName: policy.name,
        strategy: policy.strategy,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        allowed: true,
        remaining: policy.maxRequests,
        limit: policy.maxRequests,
        resetTime: new Date(Date.now() + policy.windowMs),
        retryAfterMs: 0,
        policyName: policy.name,
        strategy: policy.strategy,
      };
    }
  }

  registerPolicy(policy: RateLimitPolicyConfig): void {
    this.policies.set(policy.name, policy);

    this.logger?.info("Rate limit policy registered", { policyName: policy.name, strategy: policy.strategy });
  }

  getPolicy(name: string): RateLimitPolicyConfig | undefined {
    return this.policies.get(name);
  }

  async reset(context: RateLimitContext): Promise<void> {
    for (const policy of this.policies.values()) {
      if (policy.name === context.policyName || !context.policyName) {
        const key = this.keyResolver.resolve(context, policy.dimensions);

        await this.counter.reset(key);
      }
    }
  }

  private resolvePolicy(context: RateLimitContext): RateLimitPolicyConfig | undefined {
    if (context.policyName) {
      return this.policies.get(context.policyName);
    }

    return undefined;
  }

  private async publishRateLimitExceeded(context: RateLimitContext, decision: RateLimitDecision): Promise<void> {
    if (!this.eventPublisher) {
      return;
    }

    try {
      const event = {
        type: "rate_limit_exceeded" as const,
        context,
        decision,
        timestamp: new Date(),
        metadata: {
          source: "RateLimitEngine",
          policyName: decision.policyName,
          remaining: decision.remaining,
          retryAfterMs: decision.retryAfterMs,
        },
      };

      await this.eventPublisher.publish({
        id: `rl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: "rate_limit_exceeded",
        occurredAt: new Date(),
        metadata: {
          correlationId: "",
          version: 1,
          timestamp: new Date().toISOString(),
          source: "RateLimitEngine",
          custom: event.metadata,
        },
        payload: {
          context,
          decision,
        },
      });
    } catch (error) {
      this.logger?.error("Failed to publish rate limit exceeded event", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
