import { describe, it, expect } from "vitest";
import {
  GeoRoutingStrategy,
  LatencyRoutingStrategy,
  WeightedRoutingStrategy,
  PriorityRoutingStrategy,
  ManualRoutingStrategy,
  createRoutingStrategy,
} from "../RoutingStrategy.js";
import type { RoutingTarget } from "../types.js";
import { MultiRegionValidationError } from "../errors.js";

describe("RoutingStrategy", () => {
  const targets: RoutingTarget[] = [
    { regionId: "us-east", weight: 60, priority: 100, active: true },
    { regionId: "us-west", weight: 30, priority: 50, active: true },
    { regionId: "eu-west", weight: 10, priority: 30, active: true },
  ];

  it("geo routing selects based on distance", () => {
    const strategy = new GeoRoutingStrategy();
    const decision = strategy.selectTarget(targets);
    expect(targets.some((t) => t.regionId === decision.selectedRegionId)).toBe(true);
  });

  it("latency routing selects lowest priority (proxy for latency)", () => {
    const strategy = new LatencyRoutingStrategy();
    const decision = strategy.selectTarget(targets);
    expect(decision.selectedRegionId).toBe("eu-west");
  });

  it("weighted routing distributes across targets", () => {
    const strategy = new WeightedRoutingStrategy();
    const selected = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const decision = strategy.selectTarget(targets);
      selected.add(decision.selectedRegionId);
    }
    expect(selected.size).toBe(3);
  });

  it("weighted routing skips inactive targets", () => {
    const strategy = new WeightedRoutingStrategy();
    const withInactive = [
      { regionId: "us-east", weight: 60, priority: 100, active: false },
      { regionId: "us-west", weight: 30, priority: 50, active: true },
      { regionId: "eu-west", weight: 10, priority: 30, active: false },
    ];
    const decision = strategy.selectTarget(withInactive);
    expect(decision.selectedRegionId).toBe("us-west");
  });

  it("priority routing selects highest priority", () => {
    const strategy = new PriorityRoutingStrategy();
    const decision = strategy.selectTarget(targets);
    expect(decision.selectedRegionId).toBe("us-east");
  });

  it("priority routing respects active status", () => {
    const strategy = new PriorityRoutingStrategy();
    const withInactive = [
      { regionId: "us-east", weight: 60, priority: 100, active: false },
      { regionId: "us-west", weight: 30, priority: 50, active: true },
    ];
    const decision = strategy.selectTarget(withInactive);
    expect(decision.selectedRegionId).toBe("us-west");
  });

  it("manual routing uses override when set", () => {
    const strategy = new ManualRoutingStrategy();
    strategy.setOverride("us-west");
    const decision = strategy.selectTarget(targets);
    expect(decision.selectedRegionId).toBe("us-west");
  });

  it("manual routing falls back to first active when no override", () => {
    const strategy = new ManualRoutingStrategy();
    const decision = strategy.selectTarget(targets);
    expect(decision.selectedRegionId).toBe("us-east");
  });

  it("manual routing clears override", () => {
    const strategy = new ManualRoutingStrategy();
    strategy.setOverride("us-west");
    strategy.clearOverride();
    const decision = strategy.selectTarget(targets);
    expect(decision.selectedRegionId).toBe("us-east");
  });

  it("all strategies return alternatives list", () => {
    const strategies = [
      new GeoRoutingStrategy(),
      new LatencyRoutingStrategy(),
      new WeightedRoutingStrategy(),
      new PriorityRoutingStrategy(),
    ];
    for (const strategy of strategies) {
      const decision = strategy.selectTarget(targets);
      expect(decision.alternatives.length).toBeGreaterThanOrEqual(2);
      expect(decision.strategy).toBeDefined();
      expect(decision.decidedAt).toBeInstanceOf(Date);
    }
  });

  it("throws on empty targets", () => {
    const strategy = new GeoRoutingStrategy();
    expect(() => strategy.selectTarget([])).toThrow(MultiRegionValidationError);
  });

  it("factory creates correct strategies", () => {
    expect(createRoutingStrategy("geo")).toBeInstanceOf(GeoRoutingStrategy);
    expect(createRoutingStrategy("latency")).toBeInstanceOf(LatencyRoutingStrategy);
    expect(createRoutingStrategy("weighted")).toBeInstanceOf(WeightedRoutingStrategy);
    expect(createRoutingStrategy("priority")).toBeInstanceOf(PriorityRoutingStrategy);
    expect(createRoutingStrategy("manual")).toBeInstanceOf(ManualRoutingStrategy);
  });
});
