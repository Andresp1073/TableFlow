import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { SchedulePolicyEngine } from "../SchedulePolicy.js";
import type { Schedule, RetryPolicyConfig } from "../types.js";

function createTestSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: "test-1",
    name: "test",
    trigger: { type: "manual", id: "m1" },
    jobName: "job",
    jobData: {},
    state: "enabled",
    policy: {
      executionTimeoutMs: 30000,
      retryPolicy: { maxRetries: 3, delayMs: 1000, backoffMultiplier: 2 },
      overlapPolicy: "skip",
      misfirePolicy: "skip",
    },
    tags: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    executionCount: 0,
    misfireCount: 0,
    ...overrides,
  };
}

describe("SchedulePolicyEngine", () => {
  let engine: SchedulePolicyEngine;

  beforeEach(() => {
    engine = new SchedulePolicyEngine();
  });

  describe("canExecute", () => {
    it("allows execution for enabled schedule", () => {
      const schedule = createTestSchedule({ state: "enabled" });
      const result = engine.canExecute(schedule, { executionCount: 0, hasActiveExecution: false, state: "enabled" });
      assert.equal(result.allowed, true);
      assert.equal(result.reason, "Execution allowed");
    });

    it("blocks execution for disabled schedule", () => {
      const schedule = createTestSchedule({ state: "disabled" });
      const result = engine.canExecute(schedule, { executionCount: 0, hasActiveExecution: false, state: "disabled" });
      assert.equal(result.allowed, false);
      assert.ok(result.reason.includes("disabled"));
    });

    it("blocks execution for paused schedule", () => {
      const schedule = createTestSchedule({ state: "paused" });
      const result = engine.canExecute(schedule, { executionCount: 0, hasActiveExecution: false, state: "paused" });
      assert.equal(result.allowed, false);
      assert.ok(result.reason.includes("paused"));
    });

    it("blocks execution for completed schedule", () => {
      const schedule = createTestSchedule({ state: "completed" });
      const result = engine.canExecute(schedule, { executionCount: 5, hasActiveExecution: false, state: "completed" });
      assert.equal(result.allowed, false);
      assert.ok(result.reason.includes("completed"));
    });

    it("blocks execution for failed schedule", () => {
      const schedule = createTestSchedule({ state: "failed" });
      const result = engine.canExecute(schedule, { executionCount: 0, hasActiveExecution: false, state: "failed" });
      assert.equal(result.allowed, false);
      assert.ok(result.reason.includes("failed"));
    });

    it("blocks when max executions reached", () => {
      const schedule = createTestSchedule({
        state: "enabled",
        policy: {
          maxExecutions: 5,
          executionTimeoutMs: 30000,
          retryPolicy: { maxRetries: 3, delayMs: 1000, backoffMultiplier: 2 },
          overlapPolicy: "skip",
          misfirePolicy: "skip",
        },
      });
      const result = engine.canExecute(schedule, { executionCount: 5, hasActiveExecution: false, state: "enabled" });
      assert.equal(result.allowed, false);
      assert.ok(result.reason.includes("Max executions"));
    });

    it("allows when max executions not yet reached", () => {
      const schedule = createTestSchedule({
        state: "enabled",
        policy: {
          maxExecutions: 10,
          executionTimeoutMs: 30000,
          retryPolicy: { maxRetries: 3, delayMs: 1000, backoffMultiplier: 2 },
          overlapPolicy: "skip",
          misfirePolicy: "skip",
        },
      });
      const result = engine.canExecute(schedule, { executionCount: 5, hasActiveExecution: false, state: "enabled" });
      assert.equal(result.allowed, true);
    });

    it("allows unlimited executions when maxExecutions is undefined", () => {
      const schedule = createTestSchedule({ state: "enabled" });
      const result = engine.canExecute(schedule, { executionCount: 999, hasActiveExecution: false, state: "enabled" });
      assert.equal(result.allowed, true);
    });

    describe("overlap policies", () => {
      it("skips when overlap policy is skip and active execution exists", () => {
        const schedule = createTestSchedule({
          state: "enabled",
          policy: { ...createTestSchedule().policy, overlapPolicy: "skip" },
        });
        const result = engine.canExecute(schedule, { executionCount: 1, hasActiveExecution: true, state: "enabled" });
        assert.equal(result.allowed, false);
        assert.ok(result.reason.includes("skip"));
      });

      it("queues when overlap policy is queue and active execution exists", () => {
        const schedule = createTestSchedule({
          state: "enabled",
          policy: { ...createTestSchedule().policy, overlapPolicy: "queue" },
        });
        const result = engine.canExecute(schedule, { executionCount: 1, hasActiveExecution: true, state: "enabled" });
        assert.equal(result.allowed, true);
        assert.ok(result.reason.includes("queue"));
      });

      it("allows parallel execution when overlap policy is parallel", () => {
        const schedule = createTestSchedule({
          state: "enabled",
          policy: { ...createTestSchedule().policy, overlapPolicy: "parallel" },
        });
        const result = engine.canExecute(schedule, { executionCount: 1, hasActiveExecution: true, state: "enabled" });
        assert.equal(result.allowed, true);
        assert.ok(result.reason.includes("parallel"));
      });

      it("terminates previous when overlap policy is terminate_previous", () => {
        const schedule = createTestSchedule({
          state: "enabled",
          policy: { ...createTestSchedule().policy, overlapPolicy: "terminate_previous" },
        });
        const result = engine.canExecute(schedule, { executionCount: 1, hasActiveExecution: true, state: "enabled" });
        assert.equal(result.allowed, true);
        assert.ok(result.reason.includes("terminate previous"));
      });
    });
  });

  describe("shouldRetry", () => {
    it("returns true when attempt <= maxRetries", () => {
      assert.equal(engine.shouldRetry(1, 3), true);
      assert.equal(engine.shouldRetry(3, 3), true);
    });

    it("returns false when attempt > maxRetries", () => {
      assert.equal(engine.shouldRetry(4, 3), false);
    });

    it("returns false for attempt 1 with 0 maxRetries", () => {
      assert.equal(engine.shouldRetry(1, 0), false);
    });

    it("returns false for attempt 2 with 0 maxRetries", () => {
      assert.equal(engine.shouldRetry(2, 0), false);
    });
  });

  describe("getRetryDelay", () => {
    const config: RetryPolicyConfig = { maxRetries: 3, delayMs: 1000, backoffMultiplier: 2 };

    it("returns base delay for first attempt", () => {
      assert.equal(engine.getRetryDelay(1, config), 1000);
    });

    it("applies backoff multiplier for subsequent attempts", () => {
      assert.equal(engine.getRetryDelay(2, config), 2000);
      assert.equal(engine.getRetryDelay(3, config), 4000);
    });

    it("caps delay at 30 minutes", () => {
      const largeConfig: RetryPolicyConfig = { maxRetries: 10, delayMs: 60000, backoffMultiplier: 4 };
      const delay = engine.getRetryDelay(10, largeConfig);
      assert.equal(delay, 30 * 60 * 1000);
    });

    it("handles attempt 1 with zero delay", () => {
      const zeroConfig: RetryPolicyConfig = { maxRetries: 5, delayMs: 0, backoffMultiplier: 1 };
      assert.equal(engine.getRetryDelay(1, zeroConfig), 0);
    });
  });

  describe("handleMisfire", () => {
    it("returns skip for skip policy", () => {
      assert.equal(engine.handleMisfire("skip"), "skip");
    });

    it("returns execute_now for execute_now policy", () => {
      assert.equal(engine.handleMisfire("execute_now"), "execute_now");
    });

    it("returns execute_next for execute_next policy", () => {
      assert.equal(engine.handleMisfire("execute_next"), "execute_next");
    });
  });
});
