import { describe, it, expect, beforeEach } from "vitest";
import { ProtectionPipeline } from "../ProtectionPipeline.js";
import { createProtectionContext } from "../ProtectionContext.js";
import { HeaderValidationRule } from "../rules/HeaderValidationRule.js";
import { HttpMethodValidationRule } from "../rules/HttpMethodValidationRule.js";
import { ContentTypeValidationRule } from "../rules/ContentTypeValidationRule.js";
import { PayloadSizeValidationRule } from "../rules/PayloadSizeValidationRule.js";
import { BaseRule } from "../rules/ProtectionRule.js";
import type { ProtectionContext, ProtectionDecision } from "../types.js";

describe("ProtectionPipeline", () => {
  let pipeline: ProtectionPipeline;

  beforeEach(() => {
    pipeline = new ProtectionPipeline("test");
  });

  it("executes rules in priority order", async () => {
    const order: string[] = [];

    class OrderRule extends BaseRule {
      constructor(name: string, priority: number) {
        super(name, priority);
      }

      async evaluate(_ctx: ProtectionContext): Promise<ProtectionDecision> {
        order.push(this.name);

        return this.allowed();
      }
    }

    pipeline.addRule(new OrderRule("middle", 50));
    pipeline.addRule(new OrderRule("first", 10));
    pipeline.addRule(new OrderRule("last", 100));

    const ctx = createProtectionContext({ requestId: "order_test" });
    const result = await pipeline.execute(ctx);

    expect(order).toEqual(["first", "middle", "last"]);
    expect(result.passed).toBe(true);
  });

  it("stops execution on first reject", async () => {
    class PassRule extends BaseRule {
      constructor(name: string, priority: number, private readonly shouldReject: boolean) {
        super(name, priority);
      }

      async evaluate(_ctx: ProtectionContext): Promise<ProtectionDecision> {
        if (this.shouldReject) {
          return this.rejected("Blocked");
        }

        return this.allowed();
      }
    }

    pipeline.addRule(new PassRule("first", 10, false));
    pipeline.addRule(new PassRule("blocker", 20, true));
    pipeline.addRule(new PassRule("never_reached", 30, false));

    const ctx = createProtectionContext({ requestId: "short_circuit" });
    const result = await pipeline.execute(ctx);

    expect(result.passed).toBe(false);
    expect(result.finalDecision.ruleName).toBe("blocker");
    expect(result.decisions.length).toBe(2);
  });

  it("returns passed=true when all rules allow", async () => {
    pipeline.addRule(new HeaderValidationRule());
    pipeline.addRule(new HttpMethodValidationRule());

    const ctx = createProtectionContext({
      requestId: "all_pass",
      headers: { host: "example.com" },
      method: "GET",
    });

    const result = await pipeline.execute(ctx);

    expect(result.passed).toBe(true);
    expect(result.decisions.length).toBe(2);
  });

  it("records decisions for all executed rules", async () => {
    pipeline.addRule(new HeaderValidationRule());
    pipeline.addRule(new HttpMethodValidationRule());

    const ctx = createProtectionContext({
      requestId: "decisions",
      headers: { host: "example.com" },
    });

    const result = await pipeline.execute(ctx);

    expect(result.decisions.length).toBe(2);
    expect(result.decisions[0].ruleName).toBe("header_validation");
    expect(result.decisions[1].ruleName).toBe("http_method_validation");
  });

  it("reports duration", async () => {
    pipeline.addRule(new HeaderValidationRule());

    const ctx = createProtectionContext({
      requestId: "duration",
      headers: { host: "example.com" },
    });

    const result = await pipeline.execute(ctx);

    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("skips disabled rules", async () => {
    pipeline.addRule(new HeaderValidationRule(10));
    pipeline.addRule(new ContentTypeValidationRule(20, [], [], false));

    const ctx = createProtectionContext({
      requestId: "disabled",
      headers: { host: "example.com" },
      contentType: "application/x-sh",
    });

    const result = await pipeline.execute(ctx);

    expect(result.passed).toBe(true);
    expect(result.decisions.length).toBe(1);
  });

  it("allows request when no rules registered", async () => {
    const ctx = createProtectionContext({ requestId: "empty" });
    const result = await pipeline.execute(ctx);

    expect(result.passed).toBe(true);
    expect(result.decisions.length).toBe(0);
  });

  it("final decision respects warn over allow", async () => {
    pipeline.addRule(new PayloadSizeValidationRule());

    const ctx = createProtectionContext({
      requestId: "warn_test",
      method: "POST",
      contentType: "",
    });

    pipeline.clear();
    pipeline.addRule(new ContentTypeValidationRule());

    const result = await pipeline.execute(ctx);

    expect(result.finalDecision.action).toBe("warn");
    expect(result.passed).toBe(false);
  });
});

describe("ProtectionPipeline - management", () => {
  let pipeline: ProtectionPipeline;

  beforeEach(() => {
    pipeline = new ProtectionPipeline("mgmt");
  });

  it("addRule adds a rule", () => {
    pipeline.addRule(new HeaderValidationRule());

    expect(pipeline.ruleCount()).toBe(1);
  });

  it("addRules adds multiple rules", () => {
    pipeline.addRules([new HeaderValidationRule(), new HttpMethodValidationRule()]);

    expect(pipeline.ruleCount()).toBe(2);
  });

  it("removeRule removes a rule by name", () => {
    pipeline.addRule(new HeaderValidationRule());
    pipeline.removeRule("header_validation");

    expect(pipeline.ruleCount()).toBe(0);
  });

  it("getRule retrieves a rule by name", () => {
    pipeline.addRule(new PayloadSizeValidationRule());

    const rule = pipeline.getRule("payload_size_validation");

    expect(rule).toBeDefined();
    expect(rule!.name).toBe("payload_size_validation");
  });

  it("getRule returns undefined for unknown rule", () => {
    const rule = pipeline.getRule("nonexistent");

    expect(rule).toBeUndefined();
  });

  it("clear removes all rules", () => {
    pipeline.addRule(new HeaderValidationRule());
    pipeline.addRule(new HttpMethodValidationRule());
    pipeline.clear();

    expect(pipeline.ruleCount()).toBe(0);
  });
});
