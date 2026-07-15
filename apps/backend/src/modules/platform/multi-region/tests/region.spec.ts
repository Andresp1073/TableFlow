import { describe, it, expect } from "vitest";
import { RegionContext } from "../RegionContext.js";
import { MultiRegionValidationError } from "../errors.js";

describe("RegionContext", () => {
  it("creates a primary region", () => {
    const region = RegionContext.createPrimary("us-east", "US East", 37.7749, -122.4194);
    expect(region.id).toBe("us-east");
    expect(region.role).toBe("primary");
    expect(region.status).toBe("active");
    expect(region.isActive()).toBe(true);
  });

  it("creates a secondary region", () => {
    const region = RegionContext.createSecondary("us-west", "US West", 37.7749, -122.4194);
    expect(region.role).toBe("secondary");
    expect(region.config.priority).toBe(50);
  });

  it("creates a read-only region", () => {
    const region = RegionContext.createReadOnly("eu-west", "EU West", 51.5074, -0.1278);
    expect(region.role).toBe("read_only");
    expect(region.config.capabilities).toContain("read");
    expect(region.config.capabilities).not.toContain("write");
  });

  it("creates a disaster recovery region", () => {
    const region = RegionContext.createDisasterRecovery("ap-southeast", "Singapore", 1.3521, 103.8198);
    expect(region.role).toBe("disaster_recovery");
    expect(region.config.weight).toBe(0);
    expect(region.config.tags).toContain("dr");
  });

  it("creates a region with custom config", () => {
    const region = new RegionContext({
      id: "eu-central",
      name: "Frankfurt",
      role: "secondary",
      priority: 80,
      weight: 75,
      latitude: 50.1109,
      longitude: 8.6821,
      tags: ["eu", "production"],
      capabilities: ["read", "write"],
    });

    expect(region.name).toBe("Frankfurt");
    expect(region.config.tags).toHaveLength(2);
  });

  it("throws on invalid latitude", () => {
    expect(() => new RegionContext({
      id: "invalid", name: "Invalid", role: "primary",
      priority: 100, weight: 100, latitude: 100, longitude: 0,
      tags: [], capabilities: [],
    })).toThrow(MultiRegionValidationError);
  });

  it("throws on empty ID", () => {
    expect(() => new RegionContext({
      id: "", name: "Empty", role: "primary",
      priority: 100, weight: 100, latitude: 0, longitude: 0,
      tags: [], capabilities: [],
    })).toThrow(MultiRegionValidationError);
  });

  it("throws on invalid role", () => {
    expect(() => new RegionContext({
      id: "test", name: "Test", role: "invalid" as any,
      priority: 100, weight: 100, latitude: 0, longitude: 0,
      tags: [], capabilities: [],
    })).toThrow(MultiRegionValidationError);
  });

  it("tracks health updates", () => {
    const region = RegionContext.createPrimary("us-east", "US East", 37, -122);
    expect(region.status).toBe("active");

    region.updateHealth({ latencyMs: 45, errorRate: 0.01 });
    expect(region.getHealth().latencyMs).toBe(45);
    expect(region.getHealth().errorRate).toBe(0.01);
  });

  it("sets status correctly", () => {
    const region = RegionContext.createPrimary("us-east", "US East", 37, -122);
    region.setStatus("degraded");
    expect(region.status).toBe("degraded");
    expect(region.isActive()).toBe(false);
    expect(region.isAvailable()).toBe(true);
    expect(region.canAcceptTraffic()).toBe(true);
  });

  it("canAcceptTraffic returns true for draining", () => {
    const region = RegionContext.createPrimary("us-east", "US East", 37, -122);
    region.setStatus("draining");
    expect(region.canAcceptTraffic()).toBe(true);
    expect(region.isActive()).toBe(false);
  });

  it("converts to result", () => {
    const region = RegionContext.createPrimary("us-east", "US East", 37, -122);
    const result = region.toResult();
    expect(result.id).toBe("us-east");
    expect(result.status).toBe("active");
    expect(result.latitude).toBe(37);
  });
});
