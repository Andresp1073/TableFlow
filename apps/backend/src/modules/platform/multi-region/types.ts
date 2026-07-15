import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";

export type RegionRole =
  | "primary"
  | "secondary"
  | "read_only"
  | "disaster_recovery"
  | "maintenance";

export const REGION_ROLES: readonly RegionRole[] = [
  "primary",
  "secondary",
  "read_only",
  "disaster_recovery",
  "maintenance",
];

export type RegionStatus = "active" | "inactive" | "degraded" | "offline" | "draining";

export type RoutingStrategyType =
  | "geo"
  | "latency"
  | "weighted"
  | "priority"
  | "manual";

export const ROUTING_STRATEGY_TYPES: readonly RoutingStrategyType[] = [
  "geo",
  "latency",
  "weighted",
  "priority",
  "manual",
];

export type FailoverType = "automatic" | "manual";

export type ReplicationMode =
  | "synchronous"
  | "asynchronous"
  | "eventual_consistency"
  | "read_replicas";

export const REPLICATION_MODES: readonly ReplicationMode[] = [
  "synchronous",
  "asynchronous",
  "eventual_consistency",
  "read_replicas",
];

export type FailoverState =
  | "idle"
  | "initiating"
  | "draining"
  | "switching"
  | "verifying"
  | "completed"
  | "failed"
  | "rollback";

export type MultiRegionEventType =
  | "region.activated"
  | "region.deactivated"
  | "failover.started"
  | "failover.completed"
  | "replication.issue_detected"
  | "disaster_recovery.initiated";

export interface RegionConfig {
  id: string;
  name: string;
  role: RegionRole;
  priority: number;
  weight: number;
  latitude: number;
  longitude: number;
  tags: string[];
  capabilities: readonly string[];
}

export interface RegionHealth {
  status: RegionStatus;
  latencyMs: number;
  errorRate: number;
  uptimePercent: number;
  lastCheckedAt: Date;
  details: Record<string, unknown>;
}

export interface RoutingTarget {
  regionId: string;
  weight: number;
  priority: number;
  active: boolean;
}

export interface RoutingDecision {
  selectedRegionId: string;
  strategy: RoutingStrategyType;
  latencyMs: number;
  alternatives: readonly string[];
  decidedAt: Date;
}

export interface RoutingRule {
  name: string;
  strategy: RoutingStrategyType;
  conditions: RoutingCondition[];
  targets: RoutingTarget[];
  fallbackRegionId: string;
  enabled: boolean;
}

export interface RoutingCondition {
  type: "latency" | "geo" | "health" | "custom";
  operator: "lt" | "gt" | "eq" | "in" | "between";
  value: string | number | readonly (string | number)[];
}

export interface FailoverConfig {
  id: string;
  type: FailoverType;
  sourceRegionId: string;
  targetRegionId: string;
  trigger: FailoverTrigger;
  autoRollback: boolean;
  rollbackDelayMs: number;
  steps: readonly FailoverStep[];
}

export interface FailoverTrigger {
  type: "health_threshold" | "manual" | "scheduled";
  condition?: string;
  threshold?: number;
  cronExpression?: string;
}

export interface FailoverStep {
  name: string;
  action: string;
  timeoutMs: number;
  order: number;
  required: boolean;
}

export interface FailoverExecution {
  id: string;
  configId: string;
  state: FailoverState;
  startedAt: Date;
  completedAt?: Date;
  currentStep: number;
  steps: readonly FailoverStepResult[];
  error?: string;
}

export interface FailoverStepResult {
  stepName: string;
  success: boolean;
  startedAt: Date;
  completedAt?: Date;
  durationMs: number;
  error?: string;
  output?: Record<string, unknown>;
}

export interface ReplicationConfig {
  id: string;
  sourceRegionId: string;
  targetRegionId: string;
  mode: ReplicationMode;
  rpoTargetMs: number;
  batched: boolean;
  batchSize: number;
  batchIntervalMs: number;
  retryPolicy: ReplicationRetryPolicy;
  conflictResolution: ConflictResolutionStrategy;
  enabled: boolean;
}

export interface ReplicationRetryPolicy {
  maxRetries: number;
  backoffMs: number;
  exponentialBackoff: boolean;
}

export interface ConflictResolutionStrategy {
  type: "lww" | "source_wins" | "target_wins" | "custom" | "manual";
  customHandler?: string;
}

export interface ReplicationStatus {
  configId: string;
  lagMs: number;
  lastSyncedAt: Date;
  pendingItems: number;
  failedItems: number;
  throughputBps: number;
  healthy: boolean;
  lastError?: string;
}

export interface DisasterRecoveryProfileConfig {
  name: string;
  description: string;
  rtoSeconds: number;
  rpoSeconds: number;
  primaryRegionId: string;
  backupRegionIds: readonly string[];
  recoveryPriority: number;
  validationSteps: readonly string[];
  autoFailover: boolean;
  notificationChannels: readonly string[];
  tags: Record<string, string>;
}

export interface DisasterRecoveryProfileResult {
  name: string;
  description: string;
  rtoSeconds: number;
  rpoSeconds: number;
  primaryRegionId: string;
  backupRegionIds: readonly string[];
  recoveryPriority: number;
  validationSteps: readonly string[];
  autoFailover: boolean;
  notificationChannels: readonly string[];
  tags: Record<string, string>;
  validated: boolean;
  lastValidatedAt?: Date;
  lastDrillAt?: Date;
}

export interface DisasterRecoveryExecution {
  profileName: string;
  state: "initiating" | "validating" | "switching" | "verifying" | "completed" | "failed";
  startedAt: Date;
  completedAt?: Date;
  sourceRegionId: string;
  targetRegionId: string;
  steps: readonly DisasterRecoveryStepResult[];
  error?: string;
}

export interface DisasterRecoveryStepResult {
  stepName: string;
  success: boolean;
  startedAt: Date;
  completedAt?: Date;
  durationMs: number;
  error?: string;
}

export interface RegionManagerOptions {
  logger?: Logger;
  eventPublisher?: EventPublisher;
}

export interface RoutingStrategy {
  readonly type: RoutingStrategyType;
  selectTarget(targets: RoutingTarget[], condition?: RoutingCondition): RoutingDecision;
}

export interface FailoverPolicy {
  readonly type: FailoverType;
  execute(config: FailoverConfig): Promise<FailoverExecution>;
  validate(config: FailoverConfig): string[];
  rollback(execution: FailoverExecution): Promise<FailoverExecution>;
}

export interface ReplicationPolicy {
  readonly mode: ReplicationMode;
  validate(config: ReplicationConfig): string[];
  getStatus(config: ReplicationConfig): ReplicationStatus;
}

export interface RegionStore {
  getRegion(id: string): RegionConfig | undefined;
  listRegions(): RegionConfig[];
  getRegionHealth(id: string): RegionHealth | undefined;
  updateRegionStatus(id: string, status: RegionStatus): void;
}
