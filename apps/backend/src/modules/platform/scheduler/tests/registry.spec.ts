import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ScheduleRegistry } from "../ScheduleRegistry.js";
import type { Schedule } from "../types.js";

function createTestSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: `test-${Math.random().toString(36).slice(2, 6)}`,
    name: `test-schedule-${Math.random().toString(36).slice(2, 6)}`,
    trigger: {
      type: "manual",
      id: "manual-1",
    },
    jobName: "test-job",
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

describe("ScheduleRegistry", () => {
  let registry: ScheduleRegistry;

  beforeEach(() => {
    registry = new ScheduleRegistry();
  });

  it("registers a schedule by name", () => {
    const schedule = createTestSchedule({ name: "my-schedule" });
    registry.register(schedule);
    assert.equal(registry.count(), 1);
    assert.equal(registry.get("my-schedule")?.name, "my-schedule");
  });

  it("registers a schedule by id", () => {
    const schedule = createTestSchedule({ id: "sched-001", name: "test" });
    registry.register(schedule);
    assert.equal(registry.getById("sched-001")?.name, "test");
  });

  it("unregisters a schedule by name", () => {
    const schedule = createTestSchedule({ name: "remove-me" });
    registry.register(schedule);
    assert.equal(registry.unregister("remove-me"), true);
    assert.equal(registry.get("remove-me"), null);
    assert.equal(registry.count(), 0);
  });

  it("returns false when unregistering non-existent schedule", () => {
    assert.equal(registry.unregister("nope"), false);
  });

  it("returns null for non-existent schedule by name", () => {
    assert.equal(registry.get("nope"), null);
  });

  it("returns null for non-existent schedule by id", () => {
    assert.equal(registry.getById("nope"), null);
  });

  it("lists all registered schedules", () => {
    const a = createTestSchedule({ name: "a" });
    const b = createTestSchedule({ name: "b" });
    const c = createTestSchedule({ name: "c" });
    registry.register(a);
    registry.register(b);
    registry.register(c);
    assert.equal(registry.getAll().length, 3);
  });

  it("filters schedules by state", () => {
    const enabled = createTestSchedule({ name: "enabled-1", state: "enabled" });
    const disabled = createTestSchedule({ name: "disabled-1", state: "disabled" });
    const paused = createTestSchedule({ name: "paused-1", state: "paused" });
    registry.register(enabled);
    registry.register(disabled);
    registry.register(paused);
    assert.equal(registry.getByState("enabled").length, 1);
    assert.equal(registry.getByState("disabled").length, 1);
    assert.equal(registry.getByState("paused").length, 1);
    assert.equal(registry.getByState("failed").length, 0);
  });

  it("filters schedules by trigger type", () => {
    const manual = createTestSchedule({ name: "m", trigger: { type: "manual", id: "m1" } });
    const interval = createTestSchedule({ name: "i", trigger: { type: "fixed-interval", id: "i1", intervalMs: 5000 } });
    const oneTime = createTestSchedule({ name: "o", trigger: { type: "one-time", id: "o1", runAt: new Date() } });
    registry.register(manual);
    registry.register(interval);
    registry.register(oneTime);
    assert.equal(registry.getByTriggerType("manual").length, 1);
    assert.equal(registry.getByTriggerType("fixed-interval").length, 1);
    assert.equal(registry.getByTriggerType("one-time").length, 1);
    assert.equal(registry.getByTriggerType("cron").length, 0);
  });

  it("updates an existing schedule", () => {
    const schedule = createTestSchedule({ name: "updatable", executionCount: 0 });
    registry.register(schedule);
    schedule.executionCount = 5;
    registry.update(schedule);
    assert.equal(registry.get("updatable")?.executionCount, 5);
  });

  it("update sets updatedAt to a later date", () => {
    const schedule = createTestSchedule({ name: "update-time" });
    const original = new Date(schedule.updatedAt.getTime() - 100);
    registry.register(schedule);
    registry.update(schedule);
    assert.ok(schedule.updatedAt.getTime() >= original.getTime());
  });

  it("clears all schedules", () => {
    registry.register(createTestSchedule({ name: "a" }));
    registry.register(createTestSchedule({ name: "b" }));
    registry.clear();
    assert.equal(registry.count(), 0);
    assert.equal(registry.getAll().length, 0);
  });

  it("counts schedules correctly", () => {
    assert.equal(registry.count(), 0);
    registry.register(createTestSchedule({ name: "a" }));
    assert.equal(registry.count(), 1);
    registry.register(createTestSchedule({ name: "b" }));
    assert.equal(registry.count(), 2);
    registry.unregister("a");
    assert.equal(registry.count(), 1);
  });

  it("retrieves schedule by id after update", () => {
    const schedule = createTestSchedule({ id: "s-42", name: "name-42" });
    registry.register(schedule);
    const found = registry.getById("s-42");
    assert.notEqual(found, null);
    assert.equal(found!.name, "name-42");
  });
});
