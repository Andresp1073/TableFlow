import { describe, it, expect, vi } from "vitest";
import { PerformanceManager } from "../PerformanceManager.js";
import { PerformanceProfileBuilder } from "../PerformanceProfile.js";
import type { PerformanceMetric, PerformanceProfile } from "../types.js";

describe("PerformanceManager", () => {
  it("registers a profile from builder", () => {
    const manager = new PerformanceManager();
    const builder = PerformanceProfileBuilder.createDefault("api-service");
    const profile = manager.registerProfile(builder);
    expect(profile.name).toBe("api-service");
  });

  it("registers a profile from existing profile", () => {
    const manager = new PerformanceManager();
    const builder = PerformanceProfileBuilder.createDefault("api-service");
    const original = builder.build();
    const profile = manager.registerProfile(original);
    expect(profile.name).toBe("api-service");
  });

  it("retrieves a registered profile", () => {
    const manager = new PerformanceManager();
    manager.registerProfile(PerformanceProfileBuilder.createDefault("api"));
    const profile = manager.getProfile("api");
    expect(profile).toBeDefined();
    expect(profile!.name).toBe("api");
  });

  it("returns undefined for unknown profile", () => {
    const manager = new PerformanceManager();
    expect(manager.getProfile("unknown")).toBeUndefined();
  });

  it("lists all registered profiles", () => {
    const manager = new PerformanceManager();
    manager.registerProfile(PerformanceProfileBuilder.createDefault("svc-a"));
    manager.registerProfile(PerformanceProfileBuilder.createDefault("svc-b"));
    expect(manager.listProfiles()).toHaveLength(2);
  });

  it("performs full analysis lifecycle", async () => {
    const events: string[] = [];
    const publisher = {
      async publish(event: { type: string }) { events.push(event.type); },
      async publishMany() {},
    };

    const manager = new PerformanceManager({ eventPublisher: publisher });
    manager.registerProfile(PerformanceProfileBuilder.createDefault("api-service"));

    const metrics: PerformanceMetric[] = [
      { name: "api_response", type: "latency", value: 1500, unit: "ms", timestamp: new Date(), labels: {} },
      { name: "cpu_usage", type: "cpu", value: 95, unit: "%", timestamp: new Date(), labels: {} },
    ];

    const result = await manager.analyzePerformance(metrics, "api-service");

    expect(result.profile.name).toBe("api-service");
    expect(result.analysis).toHaveLength(2);
    expect(result.bottlenecks.length).toBeGreaterThanOrEqual(1);
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(events).toContain("performance.issue_detected");
    expect(events).toContain("optimization.suggested");
  });

  it("performs analysis with auto-created default profile", async () => {
    const manager = new PerformanceManager();
    const metrics: PerformanceMetric[] = [
      { name: "api_response", type: "latency", value: 100, unit: "ms", timestamp: new Date(), labels: {} },
    ];
    const result = await manager.analyzePerformance(metrics, "default");
    expect(result.profile.name).toBe("default");
  });

  it("detects bottlenecks directly", async () => {
    const manager = new PerformanceManager();
    const metrics: PerformanceMetric[] = [
      { name: "api_response", type: "latency", value: 600, unit: "ms", timestamp: new Date(), labels: {} },
    ];
    const bottlenecks = await manager.detectBottlenecks(metrics);
    expect(bottlenecks).toHaveLength(1);
    expect(bottlenecks[0]!.type).toBe("high_latency");
  });

  it("suggests optimizations from bottlenecks", async () => {
    const manager = new PerformanceManager();
    const metrics: PerformanceMetric[] = [
      { name: "api_response", type: "latency", value: 600, unit: "ms", timestamp: new Date(), labels: {} },
    ];
    const bottlenecks = await manager.detectBottlenecks(metrics);
    const profile = PerformanceProfileBuilder.createDefault("test").build();
    const recommendations = manager.suggestOptimizations(bottlenecks, profile);
    expect(recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it("applies and retrieves recommendations", async () => {
    const manager = new PerformanceManager();
    const metrics: PerformanceMetric[] = [
      { name: "api_response", type: "latency", value: 600, unit: "ms", timestamp: new Date(), labels: {} },
    ];
    const bottlenecks = await manager.detectBottlenecks(metrics);
    const profile = PerformanceProfileBuilder.createDefault("test").build();
    const recommendations = manager.suggestOptimizations(bottlenecks, profile);
    const applied = manager.applyOptimization(recommendations[0]!);
    expect(applied.status).toBe("applied");
    const retrieved = manager.getRecommendation(recommendations[0]!.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.status).toBe("applied");
  });

  it("dismisses a recommendation", async () => {
    const manager = new PerformanceManager();
    const bottlenecks = await manager.detectBottlenecks([
      { name: "api", type: "latency", value: 600, unit: "ms", timestamp: new Date(), labels: {} },
    ]);
    const profile = PerformanceProfileBuilder.createDefault("test").build();
    const recommendations = manager.suggestOptimizations(bottlenecks, profile);
    const dismissed = manager.dismissOptimization(recommendations[0]!);
    expect(dismissed.status).toBe("dismissed");
  });

  it("lists recommendations with status filter", async () => {
    const manager = new PerformanceManager();
    const bottlenecks = await manager.detectBottlenecks([
      { name: "api", type: "latency", value: 600, unit: "ms", timestamp: new Date(), labels: {} },
    ]);
    const profile = PerformanceProfileBuilder.createDefault("test").build();
    const recommendations = manager.suggestOptimizations(bottlenecks, profile);
    manager.applyOptimization(recommendations[0]!);
    expect(manager.listRecommendations("pending").length).toBeGreaterThanOrEqual(2);
    expect(manager.listRecommendations("applied").length).toBeGreaterThanOrEqual(1);
  });

  it("exposes analyzer, detector, engine", () => {
    const manager = new PerformanceManager();
    expect(manager.getAnalyzer()).toBeDefined();
    expect(manager.getBottleneckDetector()).toBeDefined();
    expect(manager.getOptimizationEngine()).toBeDefined();
  });

  it("stores analysis history per profile", async () => {
    const manager = new PerformanceManager();
    manager.registerProfile(PerformanceProfileBuilder.createDefault("web"));
    await manager.analyzePerformance([
      { name: "latency", type: "latency", value: 100, unit: "ms", timestamp: new Date(), labels: {} },
    ], "web");
    const history = manager.getAnalysisHistory("web");
    expect(history).toBeDefined();
    expect(history!.length).toBe(1);
  });

  it("publishes optimization.applied event when applying", async () => {
    const events: string[] = [];
    const publisher = {
      async publish(event: { type: string }) { events.push(event.type); },
      async publishMany() {},
    };
    const manager = new PerformanceManager({ eventPublisher: publisher });
    const bottlenecks = await manager.detectBottlenecks([
      { name: "api", type: "latency", value: 600, unit: "ms", timestamp: new Date(), labels: {} },
    ]);
    const profile = PerformanceProfileBuilder.createDefault("test").build();
    const recommendations = manager.suggestOptimizations(bottlenecks, profile);
    manager.applyOptimization(recommendations[0]!);
    expect(events).toContain("optimization.applied");
  });
});
