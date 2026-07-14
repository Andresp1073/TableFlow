import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { ScheduleManager } from "../ScheduleManager.js";
import { ScheduleRegistry } from "../ScheduleRegistry.js";
import { TriggerResolver } from "../TriggerResolver.js";
import { SchedulePolicyEngine } from "../SchedulePolicy.js";
import { FixedIntervalTrigger } from "../triggers/FixedIntervalTrigger.js";
import { OneTimeTrigger } from "../triggers/OneTimeTrigger.js";
import { StartupTrigger } from "../triggers/StartupTrigger.js";
import { ManualTrigger } from "../triggers/ManualTrigger.js";
import { EventTrigger } from "../triggers/EventTrigger.js";
import { CustomTrigger } from "../triggers/CustomTrigger.js";
import { CronTrigger } from "../triggers/CronTrigger.js";
import type { Schedule, JobScheduler } from "../types.js";

describe("Scheduler Integration", () => {
  let registry: ScheduleRegistry;
  let resolver: TriggerResolver;
  let policy: SchedulePolicyEngine;
  let manager: ScheduleManager;
  let executedJobs: Array<{ name: string; data: Record<string, unknown> }>;

  beforeEach(() => {
    registry = new ScheduleRegistry();
    resolver = new TriggerResolver();
    policy = new SchedulePolicyEngine();
    manager = new ScheduleManager(registry, resolver, policy);
    executedJobs = [];

    const mockJobScheduler: JobScheduler = {
      schedule: mock.fn(async (request) => {
        executedJobs.push({ name: request.name, data: request.data });
        return {
          id: `job-${executedJobs.length}`,
          name: request.name,
          type: "scheduled" as const,
          data: request.data,
          status: "pending" as const,
          priority: "normal" as const,
          createdAt: new Date(),
          scheduledAt: null,
          retryCount: 0,
          maxRetries: 3,
          tags: request.tags ?? [],
          metadata: request.metadata ?? {},
        };
      }),
      cancel: mock.fn(async () => true),
      pause: mock.fn(async () => true),
      resume: mock.fn(async () => true),
      getStatus: mock.fn(async () => "pending" as const),
      list: mock.fn(async () => []),
      getJob: mock.fn(async () => null),
    };

    manager.setJobScheduler(mockJobScheduler);
  });

  it("registers and triggers a one-time schedule", async () => {
    const past = new Date(Date.now() - 1000);
    const schedule: Schedule = {
      id: "integration-1",
      name: "one-time-integration",
      trigger: OneTimeTrigger.create(past, { id: "ot-int-1" }),
      jobName: "cleanup-job",
      jobData: { table: "audit_logs" },
      state: "enabled",
      policy: {
        executionTimeoutMs: 30000,
        retryPolicy: { maxRetries: 3, delayMs: 1000, backoffMultiplier: 2 },
        overlapPolicy: "skip",
        misfirePolicy: "skip",
      },
      tags: ["integration"],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      misfireCount: 0,
    };

    manager.registerSchedule(schedule);
    const results = await manager.checkSchedules();

    assert.equal(results.length, 1);
    assert.equal(results[0].status, "completed");
    assert.equal(results[0].scheduleName, "one-time-integration");
    assert.equal(executedJobs.length, 1);
    assert.equal(executedJobs[0].name, "cleanup-job");
  });

  it("executes a fixed-interval schedule on first tick", async () => {
    const schedule: Schedule = {
      id: "integration-2",
      name: "fixed-interval-integration",
      trigger: FixedIntervalTrigger.create(5000, { id: "fi-int-1" }),
      jobName: "heartbeat-job",
      jobData: {},
      state: "enabled",
      policy: {
        executionTimeoutMs: 30000,
        retryPolicy: { maxRetries: 0, delayMs: 0, backoffMultiplier: 1 },
        overlapPolicy: "skip",
        misfirePolicy: "skip",
      },
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      misfireCount: 0,
    };

    manager.registerSchedule(schedule);
    const results = await manager.checkSchedules();

    assert.equal(results.length, 1);
    assert.equal(results[0].status, "completed");
    assert.equal(results[0].scheduleName, "fixed-interval-integration");
  });

  it("fires startup schedule exactly once", async () => {
    const schedule: Schedule = {
      id: "integration-3",
      name: "startup-integration",
      trigger: StartupTrigger.create({ id: "st-int-1" }),
      jobName: "cache-warmup",
      jobData: {},
      state: "enabled",
      policy: {
        executionTimeoutMs: 30000,
        retryPolicy: { maxRetries: 0, delayMs: 0, backoffMultiplier: 1 },
        overlapPolicy: "skip",
        misfirePolicy: "skip",
      },
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      misfireCount: 0,
    };

    manager.registerSchedule(schedule);
    const firstTick = await manager.checkSchedules();
    assert.equal(firstTick.length, 1);
    assert.equal(firstTick[0].status, "completed");

    const secondTick = await manager.checkSchedules();
    assert.equal(secondTick.length, 0);
  });

  it("executes manual schedule via explicit trigger", async () => {
    const schedule: Schedule = {
      id: "integration-4",
      name: "manual-integration",
      trigger: ManualTrigger.create({ id: "m-int-1" }),
      jobName: "report-generation",
      jobData: { type: "daily" },
      state: "enabled",
      policy: {
        executionTimeoutMs: 60000,
        retryPolicy: { maxRetries: 2, delayMs: 5000, backoffMultiplier: 2 },
        overlapPolicy: "queue",
        misfirePolicy: "skip",
      },
      tags: ["reports"],
      metadata: { department: "analytics" },
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      misfireCount: 0,
    };

    manager.registerSchedule(schedule);
    const result = await manager.triggerSchedule("manual-integration");

    assert.notEqual(result, null);
    assert.equal(result!.status, "completed");
    assert.equal(executedJobs.length, 1);
    assert.equal(executedJobs[0].data["scheduleName"], "manual-integration");
  });

  it("event trigger schedule is registered but never fires from tick", async () => {
    const schedule: Schedule = {
      id: "integration-5",
      name: "event-integration",
      trigger: EventTrigger.create("order.placed", { id: "e-int-1", filter: { amount: { min: 100 } } }),
      jobName: "process-order",
      jobData: {},
      state: "enabled",
      policy: {
        executionTimeoutMs: 30000,
        retryPolicy: { maxRetries: 3, delayMs: 1000, backoffMultiplier: 2 },
        overlapPolicy: "parallel",
        misfirePolicy: "skip",
      },
      tags: ["events"],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      misfireCount: 0,
    };

    manager.registerSchedule(schedule);
    const results = await manager.checkSchedules();
    assert.equal(results.length, 0);
  });

  it("custom trigger schedule is registered but never fires from tick", async () => {
    const schedule: Schedule = {
      id: "integration-6",
      name: "custom-integration",
      trigger: CustomTrigger.create("business-hours", { id: "cu-int-1" }),
      jobName: "custom-job",
      jobData: {},
      state: "enabled",
      policy: {
        executionTimeoutMs: 30000,
        retryPolicy: { maxRetries: 0, delayMs: 0, backoffMultiplier: 1 },
        overlapPolicy: "skip",
        misfirePolicy: "skip",
      },
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      misfireCount: 0,
    };

    manager.registerSchedule(schedule);
    const results = await manager.checkSchedules();
    assert.equal(results.length, 0);
  });

  it("cron trigger schedule is registered but never fires from tick", async () => {
    const schedule: Schedule = {
      id: "integration-7",
      name: "cron-integration",
      trigger: CronTrigger.create("0 2 * * *", { id: "cr-int-1", timezone: "UTC" }),
      jobName: "nightly-cleanup",
      jobData: {},
      state: "enabled",
      policy: {
        executionTimeoutMs: 120000,
        retryPolicy: { maxRetries: 2, delayMs: 10000, backoffMultiplier: 2 },
        overlapPolicy: "skip",
        misfirePolicy: "execute_now",
      },
      tags: ["nightly"],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      misfireCount: 0,
    };

    manager.registerSchedule(schedule);
    const results = await manager.checkSchedules();
    assert.equal(results.length, 0);
  });

  it("paused schedule does not fire during tick", async () => {
    const past = new Date(Date.now() - 1000);
    const schedule: Schedule = {
      id: "integration-8",
      name: "paused-integration",
      trigger: OneTimeTrigger.create(past, { id: "ot-int-8" }),
      jobName: "paused-job",
      jobData: {},
      state: "paused",
      policy: {
        executionTimeoutMs: 30000,
        retryPolicy: { maxRetries: 0, delayMs: 0, backoffMultiplier: 1 },
        overlapPolicy: "skip",
        misfirePolicy: "skip",
      },
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      misfireCount: 0,
    };

    manager.registerSchedule(schedule);
    const results = await manager.checkSchedules();
    assert.equal(results.length, 0);
  });

  it("disabled schedule does not fire during tick", async () => {
    const past = new Date(Date.now() - 1000);
    const schedule: Schedule = {
      id: "integration-9",
      name: "disabled-integration",
      trigger: OneTimeTrigger.create(past, { id: "ot-int-9" }),
      jobName: "disabled-job",
      jobData: {},
      state: "disabled",
      policy: {
        executionTimeoutMs: 30000,
        retryPolicy: { maxRetries: 0, delayMs: 0, backoffMultiplier: 1 },
        overlapPolicy: "skip",
        misfirePolicy: "skip",
      },
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      misfireCount: 0,
    };

    manager.registerSchedule(schedule);
    const results = await manager.checkSchedules();
    assert.equal(results.length, 0);
  });

  it("publishes job data with schedule metadata", async () => {
    const past = new Date(Date.now() - 1000);
    const schedule: Schedule = {
      id: "integration-10",
      name: "metadata-integration",
      trigger: OneTimeTrigger.create(past, { id: "ot-int-10" }),
      jobName: "meta-check",
      jobData: { customField: "value123" },
      state: "enabled",
      policy: {
        executionTimeoutMs: 30000,
        retryPolicy: { maxRetries: 0, delayMs: 0, backoffMultiplier: 1 },
        overlapPolicy: "skip",
        misfirePolicy: "skip",
      },
      tags: ["meta"],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      misfireCount: 0,
    };

    manager.registerSchedule(schedule);
    await manager.checkSchedules();

    assert.equal(executedJobs.length, 1);
    assert.equal(executedJobs[0].data["customField"], "value123");
    assert.equal(executedJobs[0].data["scheduleId"], "integration-10");
    assert.equal(executedJobs[0].data["scheduleName"], "metadata-integration");
    assert.ok(executedJobs[0].data["executionId"]);
    assert.ok(executedJobs[0].data["triggeredAt"]);
  });

  it("handles multiple schedules of different types", async () => {
    const past = new Date(Date.now() - 1000);
    const oneTime: Schedule = {
      id: "multi-1",
      name: "multi-one-time",
      trigger: OneTimeTrigger.create(past, { id: "ot-multi-1" }),
      jobName: "job-a",
      jobData: {},
      state: "enabled",
      policy: {
        executionTimeoutMs: 30000,
        retryPolicy: { maxRetries: 0, delayMs: 0, backoffMultiplier: 1 },
        overlapPolicy: "skip",
        misfirePolicy: "skip",
      },
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      misfireCount: 0,
    };

    const startup: Schedule = {
      id: "multi-2",
      name: "multi-startup",
      trigger: StartupTrigger.create({ id: "st-multi-2" }),
      jobName: "job-b",
      jobData: {},
      state: "enabled",
      policy: {
        executionTimeoutMs: 30000,
        retryPolicy: { maxRetries: 0, delayMs: 0, backoffMultiplier: 1 },
        overlapPolicy: "skip",
        misfirePolicy: "skip",
      },
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      misfireCount: 0,
    };

    const manual: Schedule = {
      id: "multi-3",
      name: "multi-manual",
      trigger: ManualTrigger.create({ id: "m-multi-3" }),
      jobName: "job-c",
      jobData: {},
      state: "enabled",
      policy: {
        executionTimeoutMs: 30000,
        retryPolicy: { maxRetries: 0, delayMs: 0, backoffMultiplier: 1 },
        overlapPolicy: "skip",
        misfirePolicy: "skip",
      },
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      misfireCount: 0,
    };

    manager.registerSchedule(oneTime);
    manager.registerSchedule(startup);
    manager.registerSchedule(manual);

    const tickResults = await manager.checkSchedules();
    assert.equal(tickResults.length, 2);

    const manualResult = await manager.triggerSchedule("multi-manual");
    assert.equal(manualResult!.status, "completed");

    assert.equal(executedJobs.length, 3);
    assert.equal(registry.count(), 3);
  });

  it("respects max executions policy", async () => {
    const schedule: Schedule = {
      id: "integration-maxexec",
      name: "max-exec-integration",
      trigger: FixedIntervalTrigger.create(5000, { id: "fi-maxex" }),
      jobName: "limited-job",
      jobData: {},
      state: "enabled",
      policy: {
        maxExecutions: 2,
        executionTimeoutMs: 30000,
        retryPolicy: { maxRetries: 0, delayMs: 0, backoffMultiplier: 1 },
        overlapPolicy: "skip",
        misfirePolicy: "skip",
      },
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 2,
      misfireCount: 0,
      lastTriggeredAt: new Date(Date.now() - 10000),
    };

    manager.registerSchedule(schedule);
    const results = await manager.checkSchedules();
    assert.equal(results.length, 1);
    assert.equal(results[0].status, "misfired");
  });
});
