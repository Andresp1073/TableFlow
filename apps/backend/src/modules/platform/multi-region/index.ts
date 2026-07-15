export type {
  RegionRole,
  RegionStatus,
  RoutingStrategyType,
  FailoverType,
  ReplicationMode,
  FailoverState,
  MultiRegionEventType,
  RegionConfig,
  RegionHealth,
  RoutingTarget,
  RoutingDecision,
  RoutingRule,
  RoutingCondition,
  FailoverConfig,
  FailoverTrigger,
  FailoverStep,
  FailoverExecution,
  FailoverStepResult,
  ReplicationConfig,
  ReplicationRetryPolicy,
  ConflictResolutionStrategy,
  ReplicationStatus,
  DisasterRecoveryProfileConfig,
  DisasterRecoveryProfileResult,
  DisasterRecoveryExecution,
  DisasterRecoveryStepResult,
  RegionManagerOptions,
  RoutingStrategy,
  FailoverPolicy,
  ReplicationPolicy,
  RegionStore,
} from "./types.js";

export {
  REGION_ROLES,
  ROUTING_STRATEGY_TYPES,
  REPLICATION_MODES,
} from "./types.js";

export { RegionContext } from "./RegionContext.js";
export {
  GeoRoutingStrategy,
  LatencyRoutingStrategy,
  WeightedRoutingStrategy,
  PriorityRoutingStrategy,
  ManualRoutingStrategy,
  createRoutingStrategy,
} from "./RoutingStrategy.js";
export {
  AutomaticFailoverPolicy,
  ManualFailoverPolicy,
  createFailoverPolicy,
} from "./FailoverPolicy.js";
export {
  SynchronousReplicationPolicy,
  AsynchronousReplicationPolicy,
  EventualConsistencyReplicationPolicy,
  ReadReplicasReplicationPolicy,
  createReplicationPolicy,
} from "./ReplicationPolicy.js";
export { DisasterRecoveryProfile } from "./DisasterRecoveryProfile.js";
export { RegionManager } from "./RegionManager.js";

export {
  MultiRegionError,
  MultiRegionValidationError,
  RegionNotFoundError,
  RegionInactiveError,
  FailoverInProgressError,
  FailoverExecutionError,
  ReplicationError,
  DisasterRecoveryError,
} from "./errors.js";

export { createMultiRegionEvent, publishMultiRegionEvent } from "./events.js";
