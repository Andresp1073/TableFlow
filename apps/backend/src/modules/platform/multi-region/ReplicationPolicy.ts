import type { ReplicationConfig, ReplicationStatus, ReplicationMode, ReplicationPolicy as ReplicationPolicyInterface } from "./types.js";
import { REPLICATION_MODES } from "./types.js";
import { MultiRegionValidationError } from "./errors.js";

abstract class BaseReplicationPolicy implements ReplicationPolicyInterface {
  abstract readonly mode: ReplicationMode;

  validate(config: ReplicationConfig): string[] {
    const errors: string[] = [];

    if (!config.id || config.id.trim().length === 0) {
      errors.push("Replication config ID is required");
    }

    if (!config.sourceRegionId || config.sourceRegionId.trim().length === 0) {
      errors.push("Source region ID is required");
    }

    if (!config.targetRegionId || config.targetRegionId.trim().length === 0) {
      errors.push("Target region ID is required");
    }

    if (config.sourceRegionId === config.targetRegionId) {
      errors.push("Source and target regions must be different");
    }

    if (config.rpoTargetMs <= 0) {
      errors.push("RPO target must be positive");
    }

    if (!REPLICATION_MODES.includes(config.mode)) {
      errors.push(`Invalid replication mode: ${config.mode}`);
    }

    if (config.batched) {
      if (config.batchSize <= 0) {
        errors.push("Batch size must be positive when batched");
      }
      if (config.batchIntervalMs <= 0) {
        errors.push("Batch interval must be positive when batched");
      }
    }

    return errors;
  }

  abstract getStatus(config: ReplicationConfig): ReplicationStatus;

  protected buildStatus(config: ReplicationConfig, lagMs: number): ReplicationStatus {
    return {
      configId: config.id,
      lagMs,
      lastSyncedAt: new Date(),
      pendingItems: Math.max(0, Math.round(lagMs / 100)),
      failedItems: 0,
      throughputBps: 1024 * 1024,
      healthy: lagMs <= config.rpoTargetMs,
      lastError: lagMs > config.rpoTargetMs * 2 ? "Replication lag exceeds RPO target" : undefined,
    };
  }
}

export class SynchronousReplicationPolicy extends BaseReplicationPolicy {
  readonly mode: ReplicationMode = "synchronous";

  getStatus(config: ReplicationConfig): ReplicationStatus {
    const lagMs = Math.random() * 10;
    return this.buildStatus(config, lagMs);
  }
}

export class AsynchronousReplicationPolicy extends BaseReplicationPolicy {
  readonly mode: ReplicationMode = "asynchronous";

  getStatus(config: ReplicationConfig): ReplicationStatus {
    const lagMs = 50 + Math.random() * 200;
    return this.buildStatus(config, lagMs);
  }
}

export class EventualConsistencyReplicationPolicy extends BaseReplicationPolicy {
  readonly mode: ReplicationMode = "eventual_consistency";

  getStatus(config: ReplicationConfig): ReplicationStatus {
    const lagMs = 200 + Math.random() * 1000;
    return this.buildStatus(config, lagMs);
  }
}

export class ReadReplicasReplicationPolicy extends BaseReplicationPolicy {
  readonly mode: ReplicationMode = "read_replicas";

  getStatus(config: ReplicationConfig): ReplicationStatus {
    const lagMs = 10 + Math.random() * 50;
    return this.buildStatus(config, lagMs);
  }
}

export function createReplicationPolicy(mode: ReplicationMode): ReplicationPolicyInterface {
  switch (mode) {
    case "synchronous":
      return new SynchronousReplicationPolicy();
    case "asynchronous":
      return new AsynchronousReplicationPolicy();
    case "eventual_consistency":
      return new EventualConsistencyReplicationPolicy();
    case "read_replicas":
      return new ReadReplicasReplicationPolicy();
  }
}
