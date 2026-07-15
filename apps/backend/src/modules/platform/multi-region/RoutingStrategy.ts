import type { RoutingTarget, RoutingDecision, RoutingCondition, RoutingStrategy as RoutingStrategyInterface, RoutingStrategyType } from "./types.js";
import { generateEventId } from "../event-bus/EventMetadata.js";
import { MultiRegionValidationError } from "./errors.js";

abstract class BaseRoutingStrategy implements RoutingStrategyInterface {
  abstract readonly type: RoutingStrategyType;

  abstract selectTarget(targets: RoutingTarget[], condition?: RoutingCondition): RoutingDecision;

  protected validateTargets(targets: RoutingTarget[]): void {
    if (!targets || targets.length === 0) {
      throw new MultiRegionValidationError("At least one routing target is required", ["Empty targets"]);
    }
  }

  protected buildDecision(regionId: string, alternatives: RoutingTarget[]): RoutingDecision {
    return {
      selectedRegionId: regionId,
      strategy: this.type,
      latencyMs: 0,
      alternatives: alternatives.map((t) => t.regionId),
      decidedAt: new Date(),
    };
  }
}

export class GeoRoutingStrategy extends BaseRoutingStrategy {
  readonly type: RoutingStrategyType = "geo";

  selectTarget(targets: RoutingTarget[], condition?: RoutingCondition): RoutingDecision {
    this.validateTargets(targets);

    const active = targets.filter((t) => t.active);
    if (active.length === 0) {
      return this.buildDecision(targets[0]!.regionId, targets);
    }

    const selected = active.reduce((prev, curr) =>
      this.geoDistance(prev, condition) <= this.geoDistance(curr, condition) ? prev : curr,
    );

    return this.buildDecision(selected.regionId, targets);
  }

  private geoDistance(target: RoutingTarget, _condition?: RoutingCondition): number {
    return Math.abs(target.priority - 50);
  }
}

export class LatencyRoutingStrategy extends BaseRoutingStrategy {
  readonly type: RoutingStrategyType = "latency";

  selectTarget(targets: RoutingTarget[], _condition?: RoutingCondition): RoutingDecision {
    this.validateTargets(targets);

    const active = targets.filter((t) => t.active);
    if (active.length === 0) {
      return this.buildDecision(targets[0]!.regionId, targets);
    }

    const selected = active.reduce((prev, curr) =>
      prev.priority <= curr.priority ? prev : curr,
    );

    return this.buildDecision(selected.regionId, targets);
  }
}

export class WeightedRoutingStrategy extends BaseRoutingStrategy {
  readonly type: RoutingStrategyType = "weighted";
  private index: number = 0;

  selectTarget(targets: RoutingTarget[], _condition?: RoutingCondition): RoutingDecision {
    this.validateTargets(targets);

    const active = targets.filter((t) => t.active);
    if (active.length === 0) {
      return this.buildDecision(targets[0]!.regionId, targets);
    }

    const totalWeight = active.reduce((sum, t) => sum + t.weight, 0);
    if (totalWeight === 0) {
      return this.buildDecision(active[0]!.regionId, targets);
    }

    const pointer = this.index % totalWeight;
    this.index = (this.index + 1) % totalWeight;

    let cumulative = 0;
    for (const target of active) {
      cumulative += target.weight;
      if (pointer < cumulative) {
        return this.buildDecision(target.regionId, targets);
      }
    }

    return this.buildDecision(active[0]!.regionId, targets);
  }

  reset(): void {
    this.index = 0;
  }
}

export class PriorityRoutingStrategy extends BaseRoutingStrategy {
  readonly type: RoutingStrategyType = "priority";

  selectTarget(targets: RoutingTarget[], _condition?: RoutingCondition): RoutingDecision {
    this.validateTargets(targets);

    const active = targets.filter((t) => t.active);
    if (active.length === 0) {
      return this.buildDecision(targets[0]!.regionId, targets);
    }

    active.sort((a, b) => b.priority - a.priority);

    return this.buildDecision(active[0]!.regionId, targets);
  }
}

export class ManualRoutingStrategy extends BaseRoutingStrategy {
  readonly type: RoutingStrategyType = "manual";
  private overrideTargetId: string | null = null;

  setOverride(regionId: string): void {
    this.overrideTargetId = regionId;
  }

  clearOverride(): void {
    this.overrideTargetId = null;
  }

  selectTarget(targets: RoutingTarget[], _condition?: RoutingCondition): RoutingDecision {
    this.validateTargets(targets);

    if (this.overrideTargetId) {
      const override = targets.find((t) => t.regionId === this.overrideTargetId);
      if (override) {
        return this.buildDecision(override.regionId, targets);
      }
    }

    const active = targets.filter((t) => t.active);
    if (active.length === 0) {
      return this.buildDecision(targets[0]!.regionId, targets);
    }

    return this.buildDecision(active[0]!.regionId, targets);
  }
}

export function createRoutingStrategy(type: RoutingStrategyType): RoutingStrategyInterface {
  switch (type) {
    case "geo":
      return new GeoRoutingStrategy();
    case "latency":
      return new LatencyRoutingStrategy();
    case "weighted":
      return new WeightedRoutingStrategy();
    case "priority":
      return new PriorityRoutingStrategy();
    case "manual":
      return new ManualRoutingStrategy();
  }
}
