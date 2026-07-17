import { describe, it, expect } from "vitest";
import { SafetyService } from "../domain/services/SafetyService.js";
import { SafetyConfig } from "../domain/models/SafetyConfig.js";

describe("SafetyService", () => {
  const service = new SafetyService();

  const config = SafetyConfig.reconstitute({
    id: "safety-1",
    restaurantId: "rest-1",
    promptValidation: {
      enabled: true,
      maxPromptLength: 100,
      blockedPatterns: ["hack", "exploit"],
      allowedCategories: [],
    },
    outputValidation: {
      enabled: true,
      maxOutputLength: 200,
      blockedContentPatterns: ["password", "secret"],
      requireJsonFormat: false,
    },
    piiMasking: {
      enabled: true,
      patterns: [
        { name: "email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" },
        { name: "phone", pattern: "\\d{3}-\\d{3}-\\d{4}" },
      ],
      replacementText: "[REDACTED]",
    },
    rateLimiting: {
      enabled: true,
      maxRequestsPerMinute: 60,
      maxTokensPerMinute: 100000,
      maxConcurrentRequests: 10,
    },
    auditTrail: {
      enabled: true,
      retentionDays: 90,
      logPromptContents: true,
      logResponseContents: true,
    },
    usageTracking: {
      enabled: true,
      trackTokenUsage: true,
      trackCost: true,
      costPerPromptToken: 0.00001,
      costPerCompletionToken: 0.00003,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeAll(() => {
    service.setConfig(config);
  });

  it("validates a clean prompt", () => {
    const result = service.validatePrompt("What is the weather today?");
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("rejects a prompt exceeding max length", () => {
    const result = service.validatePrompt("A".repeat(200));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("max length");
  });

  it("rejects a prompt with blocked patterns", () => {
    const result = service.validatePrompt("How to hack the mainframe");
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("hack");
  });

  it("validates a clean output", () => {
    const result = service.validateOutput("This is normal output");
    expect(result.isValid).toBe(true);
  });

  it("rejects output with blocked content", () => {
    const result = service.validateOutput("The password is 12345");
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("password");
  });

  it("rejects output exceeding max length", () => {
    const result = service.validateOutput("B".repeat(300));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("max length");
  });

  it("validates JSON format when required", () => {
    const jsonConfig = SafetyConfig.reconstitute({
      id: "safety-json",
      restaurantId: "rest-1",
      promptValidation: config.promptValidation,
      outputValidation: { ...config.outputValidation, requireJsonFormat: true, maxOutputLength: 5000 },
      piiMasking: config.piiMasking,
      rateLimiting: config.rateLimiting,
      auditTrail: config.auditTrail,
      usageTracking: config.usageTracking,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const jsonService = new SafetyService();
    jsonService.setConfig(jsonConfig);

    const valid = jsonService.validateOutput('{"key": "value"}');
    expect(valid.isValid).toBe(true);

    const invalid = jsonService.validateOutput("not json");
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors[0]).toContain("JSON");
  });

  it("masks PII in text", () => {
    const masked = service.maskPII("Contact john@example.com at 555-123-4567");
    expect(masked).not.toContain("john@example.com");
    expect(masked).not.toContain("555-123-4567");
    expect(masked).toContain("[REDACTED]");
  });

  it("returns original text when PII masking is disabled", () => {
    const disabledConfig = SafetyConfig.reconstitute({
      id: "safety-pii",
      restaurantId: "rest-1",
      promptValidation: config.promptValidation,
      outputValidation: config.outputValidation,
      piiMasking: { ...config.piiMasking, enabled: false },
      rateLimiting: config.rateLimiting,
      auditTrail: config.auditTrail,
      usageTracking: config.usageTracking,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const disabledService = new SafetyService();
    disabledService.setConfig(disabledConfig);

    const result = disabledService.maskPII("test@example.com");
    expect(result).toBe("test@example.com");
  });

  it("calculates cost based on token usage", () => {
    const cost = service.calculateCost(1000, 500);
    expect(cost).toBe(1000 * 0.00001 + 500 * 0.00003);
  });

  it("returns 0 cost when tracking is disabled", () => {
    const disabledConfig = SafetyConfig.reconstitute({
      id: "safety-cost",
      restaurantId: "rest-1",
      promptValidation: config.promptValidation,
      outputValidation: config.outputValidation,
      piiMasking: config.piiMasking,
      rateLimiting: config.rateLimiting,
      auditTrail: config.auditTrail,
      usageTracking: { ...config.usageTracking, trackCost: false },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const disabledService = new SafetyService();
    disabledService.setConfig(disabledConfig);

    expect(disabledService.calculateCost(1000, 500)).toBe(0);
  });

  it("returns valid when no config is set", () => {
    const emptyService = new SafetyService();
    const result = emptyService.validatePrompt("anything");
    expect(result.isValid).toBe(true);
  });
});
