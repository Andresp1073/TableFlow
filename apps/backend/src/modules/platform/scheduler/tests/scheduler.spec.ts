import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { ScheduleManager } from "../ScheduleManager.js";
import { ScheduleRegistry } from "../ScheduleRegistry.js";
import { TriggerResolver } from "../TriggerResolver.js";
import { SchedulePolicyEngine } from "../SchedulePolicy.js";
import type { Schedule, ScheduleExecutionResult, Scheduler as SchedulerInterface, JobScheduler } from "../types.js";
import type { Logger } from "../../observability/types.js";
import type { EventPublisher } from "../../event-bus/types.js";

function createTestSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: `test-${Math.random().toString(36).slice(2, 6)}`,
    name: `sched-${Math.random().toString(36).slice(2, 6)}`,
    trigger: { type: "manual", id: "m1" },
    jobName: "test-job",
    jobData: { foo: "bar" },
    state: "enabled",
    policy: {
      executionTimeoutMs: 30000,
      retryPolicy: { maxRetries: 3, delayMs: 1000, backoffMultiplier: 2 },
      overlapPolicy: "skip",
      misfirePolicy: "skip",
    },
    tags: ["test"],
    metadata: { source: "test" },
    createdAt: new Date(),
    updatedAt: new Date(),
    executionCount: 0,
    misfireCount: 0,
    ...overrides,
  };
}

describe("ScheduleManager", () => {
  let registry: ScheduleRegistry;
  let resolver: TriggerResolver;
  let policy: SchedulePolicyEngine;
  let manager: SchedulerInterface;
  let mockJobScheduler: JobScheduler;
  let mockLogger: Logger;

  beforeEach(() => {
    registry = new ScheduleRegistry();
    resolver = new TriggerResolver();
    policy = new SchedulePolicyEngine();
    manager = new ScheduleManager(registry, resolver, policy);

    mockJobScheduler = {
      schedule: mock.fn(async () => ({
        id: "job-1",
        name: "test-job",
        type: "scheduled" as const,
        data: {},
        status: "pending" as const,
        priority: "normal" as const,
        createdAt: new Date(),
        scheduledAt: null,
        retryCount: 0,
        maxRetries: 3,
        tags: [],
        metadata: {},
      })),
      cancel: mock.fn(async () => true),
      pause: mock.fn(async () => true),
      resume: mock.fn(async () => true),
      getStatus: mock.fn(async () => "pending" as const),
      list: mock.fn(async () => []),
      getJob: mock.fn(async () => null),
    };

    mockLogger = {
      debug: mock.fn(),
      info: mock.fn(),
      warn: mock.fn(),
      error: mock.fn(),
      fatal: mock.fn(),
      log: mock.fn(),
      child: mock.fn(() => mockLogger),
    };

    manager.setJobScheduler(mockJobScheduler);
    manager.setLogger(mockLogger);
  });

  describe("registerSchedule", () => {
    it("registers a schedule successfully", () => {
      const schedule = createTestSchedule({ name: "my-schedule" });
      manager.registerSchedule(schedule);
      assert.notEqual(manager.getSchedule("my-schedule"), null);
    });

    it("assigns an id if none provided", () => {
      const schedule = createTestSchedule({ id: "" });
      manager.registerSchedule(schedule);
      const stored = manager.getSchedule(schedule.name);
      assert.ok(stored!.id);
      assert.ok(stored!.id.startsWith("sched_"));
    });

    it("throws when registering duplicate name", () => {
      manager.registerSchedule(createTestSchedule({ name: "dup" }));
      assert.throws(
        () => manager.registerSchedule(createTestSchedule({ name: "dup" })),
        /already exists/,
      );
    });
  });

  describe("unregisterSchedule", () => {
    it("removes a schedule and returns true", () => {
      manager.registerSchedule(createTestSchedule({ name: "remove" }));
      assert.equal(manager.unregisterSchedule("remove"), true);
      assert.equal(manager.getSchedule("remove"), null);
    });

    it("returns false for non-existent schedule", () => {
      assert.equal(manager.unregisterSchedule("nope"), false);
    });
  });

  describe("getSchedule / listSchedules", () => {
    it("returns null for unknown schedule", () => {
      assert.equal(manager.getSchedule("nope"), null);
    });

    it("lists all schedules", () => {
      manager.registerSchedule(createTestSchedule({ name: "a" }));
      manager.registerSchedule(createTestSchedule({ name: "b" }));
      assert.equal(manager.listSchedules().length, 2);
    });
  });

  describe("triggerSchedule", () => {
    it("executes a manual schedule via job scheduler", async () => {
      const schedule = createTestSchedule({ name: "manual-trigger" });
      manager.registerSchedule(schedule);
      const result = await manager.triggerSchedule("manual-trigger");
      assert.notEqual(result, null);
      assert.equal(result!.status, "completed");
      assert.equal(result!.scheduleName, "manual-trigger");
    });

    it("returns null for unknown schedule", async () => {
      const result = await manager.triggerSchedule("nope");
      assert.equal(result, null);
    });

    it("returns skipped status when no job scheduler configured", async () => {
      const mgr = new ScheduleManager(registry, resolver, policy);
      mgr.registerSchedule(createTestSchedule({ name: "no-scheduler" }));
      const result = await mgr.triggerSchedule("no-scheduler");
      assert.equal(result!.status, "skipped");
    });

    it("returns failed status when job scheduler throws", async () => {
      const failingScheduler: JobScheduler = {
        ...mockJobScheduler,
        schedule: mock.fn(async () => { throw new Error("Queue full"); }),
      };
      manager.setJobScheduler(failingScheduler);
      manager.registerSchedule(createTestSchedule({ name: "fail-test" }));
      const result = await manager.triggerSchedule("fail-test");
      assert.equal(result!.status, "failed");
      assert.equal(result!.error, "Queue full");
    });

    it("increments execution count on trigger", async () => {
      manager.registerSchedule(createTestSchedule({ name: "count-test" }));
      await manager.triggerSchedule("count-test");
      const sched = manager.getSchedule("count-test");
      assert.equal(sched!.executionCount, 1);
    });

    it("sets lastTriggeredAt on execution", async () => {
      manager.registerSchedule(createTestSchedule({ name: "time-test" }));
      await manager.triggerSchedule("time-test");
      const sched = manager.getSchedule("time-test");
      assert.ok(sched!.lastTriggeredAt);
    });
  });

  describe("state transitions", () => {
    it("pauses a schedule", () => {
      manager.registerSchedule(createTestSchedule({ name: "pause-me" }));
      assert.equal(manager.pauseSchedule("pause-me"), true);
      assert.equal(manager.getSchedule("pause-me")?.state, "paused");
    });

    it("returns false when pausing unknown schedule", () => {
      assert.equal(manager.pauseSchedule("nope"), false);
    });

    it("resumes a paused schedule", () => {
      manager.registerSchedule(createTestSchedule({ name: "resume-me" }));
      manager.pauseSchedule("resume-me");
      assert.equal(manager.resumeSchedule("resume-me"), true);
      assert.equal(manager.getSchedule("resume-me")?.state, "enabled");
    });

    it("returns false when resuming non-paused schedule", () => {
      manager.registerSchedule(createTestSchedule({ name: "active" }));
      assert.equal(manager.resumeSchedule("active"), false);
    });

    it("disables a schedule", () => {
      manager.registerSchedule(createTestSchedule({ name: "disable-me" }));
      assert.equal(manager.disableSchedule("disable-me"), true);
      assert.equal(manager.getSchedule("disable-me")?.state, "disabled");
    });

    it("enables a disabled schedule", () => {
      manager.registerSchedule(createTestSchedule({ name: "enable-me" }));
      manager.disableSchedule("enable-me");
      assert.equal(manager.enableSchedule("enable-me"), true);
      assert.equal(manager.getSchedule("enable-me")?.state, "enabled");
    });

    it("resets counters when enabling from completed state", () => {
      const sched = createTestSchedule({ name: "reset-me", state: "completed", executionCount: 10, misfireCount: 5 });
      manager.registerSchedule(sched);
      manager.enableSchedule("reset-me");
      const stored = manager.getSchedule("reset-me");
      assert.equal(stored!.executionCount, 0);
      assert.equal(stored!.misfireCount, 0);
      assert.equal(stored!.state, "enabled");
    });

    it("throws on invalid state transition", () => {
      manager.registerSchedule(createTestSchedule({ name: "bad-transition" }));
      manager.pauseSchedule("bad-transition");
      assert.throws(
        () => manager.disableSchedule("bad-transition"),
        /Cannot transition/,
      );
    });
  });

  describe("checkSchedules", () => {
    it("triggers schedules whose trigger condition is met", async () => {
      const past = new Date(Date.now() - 60000);
      const sched = createTestSchedule({
        name: "auto-trigger",
        trigger: { type: "one-time", id: "ot-auto", runAt: past },
      });
      manager.registerSchedule(sched);
      const results = await manager.checkSchedules();
      assert.equal(results.length, 1);
      assert.equal(results[0].status, "completed");
    });

    it("skips schedules whose trigger condition is not met", async () => {
      const future = new Date(Date.now() + 60000);
      const sched = createTestSchedule({
        name: "no-trigger",
        trigger: { type: "one-time", id: "ot-no", runAt: future },
      });
      manager.registerSchedule(sched);
      const results = await manager.checkSchedules();
      assert.equal(results.length, 0);
    });

    it("reports misfired schedules", async () => {
      const mgr = new ScheduleManager(registry, resolver, policy);
      const past = new Date(Date.now() - 60000);
      const sched = createTestSchedule({
        name: "misfire-test",
        trigger: { type: "one-time", id: "ot-mf", runAt: past },
        executionCount: 0,
        policy: {
          ...createTestSchedule().policy,
          misfirePolicy: "skip",
          maxExecutions: 0,
        },
      });
      mgr.registerSchedule(sched);
      const results = await mgr.checkSchedules();
      assert.equal(results.length, 1);
      assert.equal(results[0].status, "misfired");
    });

    it("executes misfired schedule when misfire policy is execute_now", async () => {
      const mgr = new ScheduleManager(registry, resolver, policy);
      mgr.setJobScheduler(mockJobScheduler);
      const past = new Date(Date.now() - 60000);
      const sched = createTestSchedule({
        name: "misfire-exec",
        trigger: { type: "one-time", id: "ot-exec", runAt: past },
        executionCount: 0,
        policy: {
          ...createTestSchedule().policy,
          misfirePolicy: "execute_now",
          maxExecutions: 0,
        },
      });
      mgr.registerSchedule(sched);
      const results = await mgr.checkSchedules();
      assert.equal(results.length, 1);
      assert.equal(results[0].status, "completed");
    });

    it("only processes enabled schedules", async () => {
      const past = new Date(Date.now() - 60000);
      manager.registerSchedule(createTestSchedule({
        name: "disabled-sched",
        state: "disabled",
        trigger: { type: "one-time", id: "ot-dis", runAt: past },
      }));
      const results = await manager.checkSchedules();
      assert.equal(results.length, 0);
    });
  });
});
