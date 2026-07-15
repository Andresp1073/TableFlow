import type {
  RegionConfig,
  RegionHealth,
  RegionStatus,
  RoutingTarget,
  RoutingDecision,
  RoutingRule,
  FailoverConfig,
  FailoverExecution,
  FailoverState,
  ReplicationConfig,
  ReplicationStatus,
  DisasterRecoveryProfileConfig,
  DisasterRecoveryProfileResult,
  DisasterRecoveryExecution,
  RegionManagerOptions,
  RoutingStrategy as RoutingStrategyInterface,
  FailoverPolicy as FailoverPolicyInterface,
  ReplicationPolicy as ReplicationPolicyInterface,
} from "./types.js";
import { RegionContext } from "./RegionContext.js";
import { createRoutingStrategy } from "./RoutingStrategy.js";
import { createFailoverPolicy } from "./FailoverPolicy.js";
import { createReplicationPolicy } from "./ReplicationPolicy.js";
import { DisasterRecoveryProfile } from "./DisasterRecoveryProfile.js";
import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";
import { publishMultiRegionEvent } from "./events.js";
import {
  MultiRegionValidationError,
  RegionNotFoundError,
  RegionInactiveError,
  FailoverInProgressError,
} from "./errors.js";

export class RegionManager {
  private readonly regions: Map<string, RegionContext> = new Map();
  private readonly routingRules: Map<string, RoutingRule> = new Map();
  private readonly failovers: Map<string, FailoverExecution> = new Map();
  private readonly failoverConfigs: Map<string, FailoverConfig> = new Map();
  private readonly replicationConfigs: Map<string, ReplicationConfig> = new Map();
  private readonly drProfiles: Map<string, DisasterRecoveryProfile> = new Map();
  private readonly routingStrategyCache: Map<string, RoutingStrategyInterface> = new Map();
  private readonly replicationPolicyCache: Map<string, ReplicationPolicyInterface> = new Map();
  private readonly logger?: Logger;
  private readonly eventPublisher?: EventPublisher;

  constructor(options?: RegionManagerOptions) {
    this.logger = options?.logger;
    this.eventPublisher = options?.eventPublisher;
  }

  // Region Management
  registerRegion(config: RegionConfig, health?: Partial<RegionHealth>): RegionContext {
    const region = new RegionContext(config, health);
    this.regions.set(region.id, region);
    return region;
  }

  getRegion(id: string): RegionContext | undefined {
    return this.regions.get(id);
  }

  getRegionOrThrow(id: string): RegionContext {
    const region = this.regions.get(id);
    if (!region) {
      throw new RegionNotFoundError(id);
    }
    return region;
  }

  listRegions(role?: string): RegionContext[] {
    const all = Array.from(this.regions.values());
    if (role) {
      return all.filter((r) => r.role === role);
    }
    return all;
  }

  updateRegionHealth(id: string, health: Partial<RegionHealth>): RegionContext {
    const region = this.getRegionOrThrow(id);
    region.updateHealth(health);
    return region;
  }

  setRegionStatus(id: string, status: RegionStatus): RegionContext {
    const region = this.getRegionOrThrow(id);
    const previousStatus = region.status;
    region.setStatus(status);

    if (status === "active" && previousStatus !== "active") {
      publishMultiRegionEvent(this.eventPublisher, this.logger, "region.activated", id, { previousStatus });
    } else if (status === "inactive" || status === "offline") {
      publishMultiRegionEvent(this.eventPublisher, this.logger, "region.deactivated", id, { previousStatus });
    }

    return region;
  }

  getRoutingTargets(): RoutingTarget[] {
    return Array.from(this.regions.values())
      .filter((r) => r.canAcceptTraffic())
      .map((r) => ({
        regionId: r.id,
        weight: r.config.weight,
        priority: r.config.priority,
        active: r.isActive(),
      }));
  }

  // Routing
  addRoutingRule(rule: RoutingRule): void {
    this.routingRules.set(rule.name, rule);
  }

  getRoutingRule(name: string): RoutingRule | undefined {
    return this.routingRules.get(name);
  }

  resolveRoute(name: string, routingStrategyType?: string): RoutingDecision {
    const rule = this.routingRules.get(name);
    if (!rule) {
      throw new RegionNotFoundError(`Routing rule not found: ${name}`);
    }

    const strategyType = routingStrategyType ?? rule.strategy;
    const cacheKey = `${name}:${strategyType}`;

    let strategy = this.routingStrategyCache.get(cacheKey);
    if (!strategy) {
      strategy = createRoutingStrategy(strategyType as any);
      this.routingStrategyCache.set(cacheKey, strategy);
    }

    const targets = rule.targets.length > 0 ? rule.targets : this.getRoutingTargets();
    return strategy.selectTarget(targets);
  }

  // Failover
  registerFailoverConfig(config: FailoverConfig): void {
    const errors: string[] = [];
    if (!config.id) errors.push("Failover config ID is required");
    if (this.failoverConfigs.has(config.id)) {
      errors.push(`Failover config already exists: ${config.id}`);
    }
    if (errors.length > 0) {
      throw new MultiRegionValidationError("Invalid failover config", errors);
    }
    this.failoverConfigs.set(config.id, config);
  }

  async executeFailover(configId: string): Promise<FailoverExecution> {
    const config = this.failoverConfigs.get(configId);
    if (!config) {
      throw new RegionNotFoundError(`Failover config not found: ${configId}`);
    }

    const existing = Array.from(this.failovers.values())
      .find((f) => f.configId === configId && (f.state === "initiating" || f.state === "switching" || f.state === "draining"));
    if (existing) {
      throw new FailoverInProgressError(existing.id);
    }

    publishMultiRegionEvent(this.eventPublisher, this.logger, "failover.started", configId, {
      sourceId: config.sourceRegionId,
      targetId: config.targetRegionId,
    });

    const failoverPolicy = createFailoverPolicy(config.type, { logger: this.logger });

    try {
      const execution = await failoverPolicy.execute(config);
      this.failovers.set(execution.id, execution);

      publishMultiRegionEvent(this.eventPublisher, this.logger, "failover.completed", execution.id, {
        configId,
        state: execution.state,
        sourceId: config.sourceRegionId,
        targetId: config.targetRegionId,
      });

      return execution;
    } catch (error) {
      const failedExecution: FailoverExecution = {
        id: configId,
        configId,
        state: "failed",
        startedAt: new Date(),
        completedAt: new Date(),
        currentStep: 0,
        steps: [],
        error: error instanceof Error ? error.message : String(error),
      };
      this.failovers.set(failedExecution.id, failedExecution);

      publishMultiRegionEvent(this.eventPublisher, this.logger, "failover.completed", configId, {
        state: "failed",
        error: failedExecution.error,
      });

      return failedExecution;
    }
  }

  getFailoverState(configId: string): FailoverExecution | undefined {
    return Array.from(this.failovers.values())
      .filter((f) => f.configId === configId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];
  }

  // Replication
  registerReplicationConfig(config: ReplicationConfig): void {
    this.replicationConfigs.set(config.id, config);
  }

  getReplicationStatus(configId: string): ReplicationStatus | undefined {
    const config = this.replicationConfigs.get(configId);
    if (!config) {
      return undefined;
    }

    const cacheKey = `${config.sourceRegionId}→${config.targetRegionId}:${config.mode}`;
    let policy = this.replicationPolicyCache.get(cacheKey);
    if (!policy) {
      policy = createReplicationPolicy(config.mode);
      this.replicationPolicyCache.set(cacheKey, policy);
    }

    return policy.getStatus(config);
  }

  checkReplicationHealth(): ReplicationStatus[] {
    return Array.from(this.replicationConfigs.values()).map((config) => {
      const status = this.getReplicationStatus(config.id);
      return status!;
    });
  }

  // Disaster Recovery
  registerDisasterRecoveryProfile(config: DisasterRecoveryProfileConfig): DisasterRecoveryProfileResult {
    const profile = new DisasterRecoveryProfile(config);
    this.drProfiles.set(profile.name, profile);
    return profile.toResult();
  }

  getDisasterRecoveryProfile(name: string): DisasterRecoveryProfileResult | undefined {
    return this.drProfiles.get(name)?.toResult();
  }

  listDisasterRecoveryProfiles(): DisasterRecoveryProfileResult[] {
    return Array.from(this.drProfiles.values()).map((p) => p.toResult());
  }

  async executeDisasterRecovery(profileName: string, targetRegionId: string): Promise<DisasterRecoveryExecution> {
    const profile = this.drProfiles.get(profileName);
    if (!profile) {
      throw new RegionNotFoundError(`DR profile not found: ${profileName}`);
    }

    publishMultiRegionEvent(this.eventPublisher, this.logger, "disaster_recovery.initiated", profileName, {
      targetRegionId,
      primaryRegionId: profile.primaryRegionId,
      rtoSeconds: profile.rtoSeconds,
      rpoSeconds: profile.rpoSeconds,
    });

    return profile.execute(targetRegionId);
  }

  markDrProfileValidated(name: string): DisasterRecoveryProfileResult | undefined {
    const profile = this.drProfiles.get(name);
    if (!profile) return undefined;
    profile.markValidated();
    return profile.toResult();
  }

  markDrDrillPerformed(name: string): DisasterRecoveryProfileResult | undefined {
    const profile = this.drProfiles.get(name);
    if (!profile) return undefined;
    profile.markDrillPerformed();
    return profile.toResult();
  }
}
