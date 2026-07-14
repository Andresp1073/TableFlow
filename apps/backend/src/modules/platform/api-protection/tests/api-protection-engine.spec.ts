import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiProtectionEngine } from "../ApiProtectionEngine.js";
import { ProtectionPipeline } from "../ProtectionPipeline.js";
import { HeaderValidationRule } from "../rules/HeaderValidationRule.js";
import { HttpMethodValidationRule } from "../rules/HttpMethodValidationRule.js";
import { ContentTypeValidationRule } from "../rules/ContentTypeValidationRule.js";
import { ThreatDetectionRule } from "../rules/ThreatDetectionRule.js";
import { ThreatAnalyzer } from "../ThreatAnalyzer.js";
import { createProtectionContext } from "../ProtectionContext.js";
import type { ApiProtectionMetricsCollector } from "../types.js";

describe("ApiProtectionEngine", () => {
  let pipeline: ProtectionPipeline;
  let engine: ApiProtectionEngine;
  let metrics: ApiProtectionMetricsCollector;

  function createEngine(pipelineName = "test", opts?: Partial<ConstructorParameters<typeof ApiProtectionEngine>[0]>) {
    metrics = {
      incrementRejected: vi.fn(),
      incrementWarnings: vi.fn(),
      incrementThreatCategory: vi.fn(),
      recordPipelineDuration: vi.fn(),
      incrementRuleDuration: vi.fn(),
    };

    return new ApiProtectionEngine({
      pipeline: new ProtectionPipeline(pipelineName),
      metrics,
      ...opts,
    });
  }

  beforeEach(() => {
    pipeline = new ProtectionPipeline("test");
    engine = createEngine();
  });

  describe("evaluate", () => {
    it("allows clean request", async () => {
      engine.registerRule(new HeaderValidationRule());

      const ctx = createProtectionContext({
        requestId: "req_1",
        headers: { host: "example.com" },
      });

      const result = await engine.evaluate(ctx);

      expect(result.action).toBe("allow");
    });

    it("rejects request with blocked headers", async () => {
      engine.registerRule(new HeaderValidationRule());

      const ctx = createProtectionContext({
        requestId: "req_2",
        headers: { host: "example.com", "x-forwarded-for": "10.0.0.1" },
      });

      const result = await engine.evaluate(ctx);

      expect(result.action).toBe("reject");
    });

    it("records metrics on rejection", async () => {
      engine.registerRule(new HttpMethodValidationRule());

      const ctx = createProtectionContext({
        requestId: "req_3",
        method: "TRACE",
      });

      await engine.evaluate(ctx);

      expect(metrics.incrementRejected).toHaveBeenCalled();
      expect(metrics.recordPipelineDuration).toHaveBeenCalled();
    });

    it("records metrics on warning", async () => {
      engine.registerRule(new ContentTypeValidationRule());

      const ctx = createProtectionContext({
        requestId: "req_4",
        method: "POST",
        contentType: "",
      });

      await engine.evaluate(ctx);

      expect(metrics.incrementWarnings).toHaveBeenCalled();
    });

    it("records threat category metrics", async () => {
      const analyzer = new ThreatAnalyzer();
      const threatRule = new ThreatDetectionRule(analyzer);

      engine.registerRule(threatRule);

      const ctx = createProtectionContext({
        requestId: "req_5",
        method: "GET",
        path: "/search",
        query: { q: "<script>alert(1)</script>" },
      });

      await engine.evaluate(ctx);

      expect(metrics.incrementThreatCategory).toHaveBeenCalledWith("xss");
    });

    it("publishes event when eventPublisher is configured", async () => {
      const publish = vi.fn();
      const eventEngine = createEngine("event_test", {
        eventPublisher: { publish, publishMany: vi.fn() },
      });

      eventEngine.registerRule(new HttpMethodValidationRule());

      const ctx = createProtectionContext({
        requestId: "req_6",
        method: "TRACE",
      });

      await eventEngine.evaluate(ctx);

      expect(publish).toHaveBeenCalled();
      const publishedEvent = publish.mock.calls[0][0];

      expect(publishedEvent.type).toBe("api_request_rejected");
      expect(publishedEvent.metadata.source).toContain("ApiProtectionEngine");
    });

    it("publishes api_threat_detected for threats above threshold", async () => {
      const publish = vi.fn();
      const analyzer = new ThreatAnalyzer();
      const threatRule = new ThreatDetectionRule(analyzer, 70, "medium");

      const eventEngine = createEngine("threat_test", {
        eventPublisher: { publish, publishMany: vi.fn() },
      });

      eventEngine.registerRule(threatRule);

      const ctx = createProtectionContext({
        requestId: "req_7",
        method: "GET",
        path: "/",
        query: { q: "<script>alert(1)</script>" },
      });

      await eventEngine.evaluate(ctx);

      expect(publish).toHaveBeenCalled();
    });

    it("handles pipeline with multiple rules", async () => {
      engine.registerRules([
        new HeaderValidationRule(),
        new HttpMethodValidationRule(),
        new ContentTypeValidationRule(),
      ]);

      const ctx = createProtectionContext({
        requestId: "req_8",
        headers: { host: "example.com" },
        method: "POST",
        contentType: "application/json",
        body: { data: "test" },
      });

      const result = await engine.evaluate(ctx);

      expect(result.action).toBe("allow");
    });

    it("returns rejected from first failing rule", async () => {
      engine.registerRules([
        new HeaderValidationRule(),
        new HttpMethodValidationRule(),
      ]);

      const ctx = createProtectionContext({
        requestId: "req_9",
        headers: {},
        method: "TRACE",
      });

      const result = await engine.evaluate(ctx);

      expect(result.action).toBe("reject");
      expect(result.ruleName).toBe("header_validation");
    });
  });

  describe("getPipeline", () => {
    it("returns the configured pipeline", () => {
      const p = engine.getPipeline();

      expect(p.name).toBe("test");
    });
  });

  describe("registerRule / registerRules", () => {
    it("registerRule adds a rule to the pipeline", () => {
      engine.registerRule(new HeaderValidationRule());

      expect(engine.getPipeline().ruleCount()).toBe(1);
    });

    it("registerRules adds multiple rules", () => {
      engine.registerRules([new HeaderValidationRule(), new HttpMethodValidationRule()]);

      expect(engine.getPipeline().ruleCount()).toBe(2);
    });
  });
});
