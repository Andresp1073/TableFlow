import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { TriggerResolver } from "../TriggerResolver.js";
import type {
  ScheduleTriggerConfig,
  TriggerEvaluationContext,
} from "../types.js";

describe("TriggerResolver", () => {
  let resolver: TriggerResolver;

  beforeEach(() => {
    resolver = new TriggerResolver();
  });

  function makeContext(overrides: Partial<TriggerEvaluationContext> = {}): TriggerEvaluationContext {
    return {
      lastTriggeredAt: undefined,
      lastCompletedAt: undefined,
      executionCount: 0,
      misfireCount: 0,
      state: "enabled",
      now: new Date(),
      ...overrides,
    };
  }

  describe("evaluate", () => {
    it("returns not-fire when schedule is not enabled", () => {
      const result = resolver.evaluate(
        { type: "manual", id: "m1" },
        makeContext({ state: "disabled" }),
      );
      assert.equal(result.shouldFire, false);
      assert.equal(result.reason, "Schedule is not enabled");
    });

    describe("fixed-interval trigger", () => {
      it("fires when never triggered before", () => {
        const trigger: ScheduleTriggerConfig = { type: "fixed-interval", id: "fi1", intervalMs: 5000 };
        const result = resolver.evaluate(trigger, makeContext());
        assert.equal(result.shouldFire, true);
        assert.equal(result.reason, "Fixed-interval trigger: never fired before");
        assert.ok(result.nextFireTime);
      });

      it("fires when interval has elapsed", () => {
        const trigger: ScheduleTriggerConfig = { type: "fixed-interval", id: "fi2", intervalMs: 5000 };
        const past = new Date(Date.now() - 10000);
        const result = resolver.evaluate(trigger, makeContext({ lastTriggeredAt: past }));
        assert.equal(result.shouldFire, true);
      });

      it("does not fire when interval has not elapsed", () => {
        const trigger: ScheduleTriggerConfig = { type: "fixed-interval", id: "fi3", intervalMs: 60000 };
        const recent = new Date(Date.now() - 5000);
        const result = resolver.evaluate(trigger, makeContext({ lastTriggeredAt: recent }));
        assert.equal(result.shouldFire, false);
      });

      it("defers first fire when delayStartMs is set and not yet elapsed", () => {
        const trigger: ScheduleTriggerConfig = {
          type: "fixed-interval", id: "fi4", intervalMs: 5000, delayStartMs: 10000,
        };
        const result = resolver.evaluate(trigger, makeContext());
        assert.equal(result.shouldFire, false);
        assert.ok(result.reason.includes("delay start"));
      });

      it("reports next fire time", () => {
        const trigger: ScheduleTriggerConfig = { type: "fixed-interval", id: "fi5", intervalMs: 5000 };
        const past = new Date(Date.now() - 10000);
        const result = resolver.evaluate(trigger, makeContext({ lastTriggeredAt: past }));
        assert.ok(result.nextFireTime);
        assert.ok(result.nextFireTime!.getTime() > Date.now());
      });
    });

    describe("cron trigger", () => {
      it("returns not-fire with reason indicating cron provider needed", () => {
        const trigger: ScheduleTriggerConfig = { type: "cron", id: "c1", expression: "0 * * * *" };
        const result = resolver.evaluate(trigger, makeContext());
        assert.equal(result.shouldFire, false);
        assert.ok(result.reason.includes("cron provider"));
      });
    });

    describe("one-time trigger", () => {
      it("fires when scheduled time is in the past", () => {
        const trigger: ScheduleTriggerConfig = { type: "one-time", id: "ot1", runAt: new Date(Date.now() - 1000) };
        const result = resolver.evaluate(trigger, makeContext());
        assert.equal(result.shouldFire, true);
      });

      it("does not fire when scheduled time is in the future", () => {
        const trigger: ScheduleTriggerConfig = { type: "one-time", id: "ot2", runAt: new Date(Date.now() + 60000) };
        const result = resolver.evaluate(trigger, makeContext());
        assert.equal(result.shouldFire, false);
        assert.ok(result.nextFireTime);
      });

      it("does not fire after already executed once", () => {
        const trigger: ScheduleTriggerConfig = { type: "one-time", id: "ot3", runAt: new Date(Date.now() - 1000) };
        const result = resolver.evaluate(trigger, makeContext({ executionCount: 1 }));
        assert.equal(result.shouldFire, false);
        assert.equal(result.reason, "One-time trigger already fired");
      });

      it("reports next fire time as the scheduled time", () => {
        const future = new Date(Date.now() + 60000);
        const trigger: ScheduleTriggerConfig = { type: "one-time", id: "ot4", runAt: future };
        const result = resolver.evaluate(trigger, makeContext());
        assert.equal(result.nextFireTime?.getTime(), future.getTime());
      });
    });

    describe("startup trigger", () => {
      it("fires when never executed", () => {
        const trigger: ScheduleTriggerConfig = { type: "startup", id: "st1" };
        const result = resolver.evaluate(trigger, makeContext());
        assert.equal(result.shouldFire, true);
      });

      it("does not fire after already executed once", () => {
        const trigger: ScheduleTriggerConfig = { type: "startup", id: "st2" };
        const result = resolver.evaluate(trigger, makeContext({ executionCount: 1 }));
        assert.equal(result.shouldFire, false);
        assert.equal(result.reason, "Startup trigger already fired");
      });
    });

    describe("manual trigger", () => {
      it("never fires automatically", () => {
        const trigger: ScheduleTriggerConfig = { type: "manual", id: "m1" };
        const result = resolver.evaluate(trigger, makeContext());
        assert.equal(result.shouldFire, false);
        assert.equal(result.reason, "Manual trigger requires explicit invocation");
      });
    });

    describe("event trigger", () => {
      it("never fires from evaluation alone", () => {
        const trigger: ScheduleTriggerConfig = { type: "event", id: "e1", eventType: "order.placed" };
        const result = resolver.evaluate(trigger, makeContext());
        assert.equal(result.shouldFire, false);
        assert.equal(result.reason, "Event trigger requires event matching");
      });
    });

    describe("custom trigger", () => {
      it("never fires from evaluation alone", () => {
        const trigger: ScheduleTriggerConfig = { type: "custom", id: "cu1", customType: "my-custom-evaluator" };
        const result = resolver.evaluate(trigger, makeContext());
        assert.equal(result.shouldFire, false);
        assert.equal(result.reason, 'Custom trigger "my-custom-evaluator" requires explicit evaluation');
      });
    });
  });

  describe("getNextFireTime", () => {
    it("returns null for manual trigger", () => {
      assert.equal(resolver.getNextFireTime({ type: "manual", id: "m1" }), null);
    });

    it("returns null for cron trigger", () => {
      assert.equal(resolver.getNextFireTime({ type: "cron", id: "c1", expression: "0 * * * *" }), null);
    });

    it("returns null for startup trigger", () => {
      assert.equal(resolver.getNextFireTime({ type: "startup", id: "st1" }), null);
    });

    it("returns null for event trigger", () => {
      assert.equal(resolver.getNextFireTime({ type: "event", id: "e1", eventType: "test" }), null);
    });

    it("returns null for custom trigger", () => {
      assert.equal(resolver.getNextFireTime({ type: "custom", id: "cu1", customType: "test" }), null);
    });

    it("returns fire time for fixed-interval trigger", () => {
      const after = new Date();
      const result = resolver.getNextFireTime({ type: "fixed-interval", id: "fi1", intervalMs: 5000 }, after);
      assert.ok(result);
      assert.equal(result!.getTime() - after.getTime(), 5000);
    });

    it("returns runAt for future one-time trigger", () => {
      const future = new Date(Date.now() + 60000);
      const result = resolver.getNextFireTime({ type: "one-time", id: "ot1", runAt: future });
      assert.equal(result?.getTime(), future.getTime());
    });

    it("returns null for past one-time trigger", () => {
      const past = new Date(Date.now() - 60000);
      const result = resolver.getNextFireTime({ type: "one-time", id: "ot1", runAt: past });
      assert.equal(result, null);
    });

    it("returns null for unknown trigger type", () => {
      const result = resolver.getNextFireTime({ type: "unknown" as never, id: "unk" });
      assert.equal(result, null);
    });
  });
});
