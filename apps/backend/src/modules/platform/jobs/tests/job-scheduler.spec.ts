import { describe, it, expect, beforeEach } from "vitest";
import { JobScheduler } from "../JobScheduler.js";
import { JobDispatcher } from "../JobDispatcher.js";
import { JobExecutor } from "../JobExecutor.js";
import { JobRegistry } from "../JobRegistry.js";
import { InMemoryJobQueue } from "../InMemoryJobQueue.js";
import type { Job, JobResult } from "../types.js";

describe("JobScheduler", () => {
  let registry: JobRegistry;
  let executor: JobExecutor;
  let queue: InMemoryJobQueue;
  let dispatcher: JobDispatcher;
  let scheduler: JobScheduler;

  beforeEach(() => {
    registry = new JobRegistry();
    executor = new JobExecutor({ registry });
    queue = new InMemoryJobQueue();
    dispatcher = new JobDispatcher(executor);
    dispatcher.registerProvider(queue);
    scheduler = new JobScheduler(dispatcher, queue);
  });

  it("schedules an immediate job", async () => {
    const job = await scheduler.schedule({
      name: "test-job",
      data: { key: "value" },
    });

    expect(job.id).toBeDefined();
    expect(job.name).toBe("test-job");
    expect(job.type).toBe("immediate");
    expect(job.status).toBe("pending");
    expect(job.data).toEqual({ key: "value" });
    expect(job.priority).toBe("normal");
    expect(job.createdAt).toBeInstanceOf(Date);
    expect(await queue.length()).toBe(1);
  });

  it("schedules a delayed job", async () => {
    const job = await scheduler.schedule({
      name: "delayed-job",
      data: {},
      type: "delayed",
      delayMs: 5000,
    });

    expect(job.type).toBe("delayed");
    expect(job.scheduledAt).toBeDefined();
    expect(job.scheduledAt!.getTime()).toBeGreaterThan(Date.now());
  });

  it("schedules with custom priority", async () => {
    const job = await scheduler.schedule({
      name: "high-priority",
      data: {},
      priority: "critical",
    });

    expect(job.priority).toBe("critical");
  });

  it("schedules with tags", async () => {
    const job = await scheduler.schedule({
      name: "tagged-job",
      data: {},
      tags: ["notifications", "email"],
    });

    expect(job.tags).toEqual(["notifications", "email"]);
  });

  it("schedules with metadata", async () => {
    const job = await scheduler.schedule({
      name: "meta-job",
      data: {},
      metadata: { source: "test", version: 2 },
    });

    expect(job.metadata.source).toBe("test");
    expect(job.metadata.version).toBe(2);
  });

  it("schedules with custom retry policy", async () => {
    const job = await scheduler.schedule({
      name: "retry-job",
      data: {},
      retryPolicy: { maxRetries: 5, initialDelayMs: 2000 },
    });

    expect(job.maxRetries).toBe(5);
    expect(job.metadata.retryPolicy).toBeDefined();
    expect(job.metadata.retryPolicy.maxRetries).toBe(5);
  });

  it("schedules an immediate job (explicit type)", async () => {
    const job = await scheduler.schedule({
      name: "explicit-job",
      data: {},
      type: "immediate",
    });

    expect(job.type).toBe("immediate");
    expect(job.scheduledAt).toBeNull();
  });

  it("gets job status", async () => {
    const job = await scheduler.schedule({ name: "status-job", data: {} });

    const status = await scheduler.getStatus(job.id);

    expect(status).toBe("pending");
  });

  it("returns null for unknown job status", async () => {
    const status = await scheduler.getStatus("nonexistent");

    expect(status).toBeNull();
  });

  it("gets a job by id", async () => {
    const scheduled = await scheduler.schedule({ name: "get-job", data: {} });

    const retrieved = await scheduler.getJob(scheduled.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(scheduled.id);
    expect(retrieved!.name).toBe("get-job");
  });

  it("returns null for unknown job", async () => {
    const job = await scheduler.getJob("nonexistent");

    expect(job).toBeNull();
  });

  it("cancels a pending job", async () => {
    const job = await scheduler.schedule({ name: "cancel-job", data: {} });

    const cancelled = await scheduler.cancel(job.id);

    expect(cancelled).toBe(true);

    const status = await scheduler.getStatus(job.id);

    expect(status).toBe("cancelled");
  });

  it("cannot cancel a running job", async () => {
    const job = await scheduler.schedule({ name: "running-job", data: {} });

    job.status = "running";

    const cancelled = await scheduler.cancel(job.id);

    expect(cancelled).toBe(false);
  });

  it("lists jobs with filters", async () => {
    await scheduler.schedule({ name: "job-a", data: {}, tags: ["tag1"] });
    await scheduler.schedule({ name: "job-b", data: {}, tags: ["tag2"] });
    await scheduler.schedule({ name: "job-c", data: {}, tags: ["tag1"] });

    const all = await scheduler.list();

    expect(all).toHaveLength(3);

    const filtered = await scheduler.list({ tags: ["tag1"] });

    expect(filtered).toHaveLength(2);
  });

  it("lists jobs filtered by name", async () => {
    await scheduler.schedule({ name: "specific-name", data: {} });
    await scheduler.schedule({ name: "other-name", data: {} });

    const results = await scheduler.list({ name: "specific-name" });

    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe("specific-name");
  });

  it("lists jobs filtered by status", async () => {
    const job = await scheduler.schedule({ name: "status-filter", data: {} });

    job.status = "completed";

    const pending = await scheduler.list({ status: ["pending"] });

    expect(pending).toHaveLength(0);

    const completed = await scheduler.list({ status: ["completed"] });

    expect(completed).toHaveLength(1);
  });

  it("lists jobs filtered by priority", async () => {
    await scheduler.schedule({ name: "p1", data: {}, priority: "high" });
    await scheduler.schedule({ name: "p2", data: {}, priority: "low" });

    const high = await scheduler.list({ priority: "high" });

    expect(high).toHaveLength(1);
    expect(high[0]!.name).toBe("p1");
  });
});
