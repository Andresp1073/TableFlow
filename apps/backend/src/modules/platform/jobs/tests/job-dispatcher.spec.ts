import { describe, it, expect, vi, beforeEach } from "vitest";
import { JobDispatcher } from "../JobDispatcher.js";
import { JobExecutor } from "../JobExecutor.js";
import { JobRegistry } from "../JobRegistry.js";
import { InMemoryJobQueue } from "../InMemoryJobQueue.js";
import type { Job, JobHandler, JobResult, JobContext } from "../types.js";

function createJob(overrides: Partial<Job> = {}): Job {
  return {
    id: overrides.id ?? "job-1",
    name: "test-job",
    type: "immediate",
    data: {},
    status: "pending",
    priority: "normal",
    createdAt: new Date(),
    scheduledAt: null,
    retryCount: 0,
    maxRetries: 3,
    tags: [],
    metadata: {},
    ...overrides,
  };
}

describe("JobDispatcher", () => {
  let registry: JobRegistry;
  let executor: JobExecutor;
  let queue: InMemoryJobQueue;
  let dispatcher: JobDispatcher;

  beforeEach(() => {
    registry = new JobRegistry();
    executor = new JobExecutor({ registry });
    queue = new InMemoryJobQueue();
    dispatcher = new JobDispatcher(executor);
    dispatcher.registerProvider(queue);
  });

  it("throws when no provider is registered", async () => {
    const d = new JobDispatcher(executor);

    await expect(d.dispatch(createJob())).rejects.toThrow("No queue provider");
  });

  it("dispatches a job to the queue", async () => {
    await dispatcher.dispatch(createJob());

    expect(await queue.length()).toBe(1);
  });

  it("processNext returns false when queue is empty", async () => {
    const processed = await dispatcher.processNext();

    expect(processed).toBe(false);
  });

  it("processNext executes a job and marks it completed", async () => {
    registry.register({
      jobName: "test-job",
      async execute(): Promise<JobResult> {
        return { status: "completed" };
      },
    });

    await dispatcher.dispatch(createJob());

    const processed = await dispatcher.processNext();

    expect(processed).toBe(true);
    expect(await queue.length()).toBe(0);
  });

  it("processNext requeues a retryable job", async () => {
    registry.register({
      jobName: "test-job",
      async execute(): Promise<JobResult> {
        return { status: "retry", error: "temp failure", retryDelay: 100 };
      },
    });

    await dispatcher.dispatch(createJob());

    const processed = await dispatcher.processNext();

    expect(processed).toBe(true);
    // job should be requeued for retry
    expect(await queue.length()).toBe(1);
  });

  it("processNext marks job as failed when handler returns failed", async () => {
    registry.register({
      jobName: "test-job",
      async execute(): Promise<JobResult> {
        return { status: "failed", error: "business error" };
      },
    });

    await dispatcher.dispatch(createJob());

    const processed = await dispatcher.processNext();

    expect(processed).toBe(true);
    expect(await queue.length()).toBe(0);
  });

  it("processNext handles unexpected errors gracefully", async () => {
    registry.register({
      jobName: "test-job",
      async execute(): Promise<JobResult> {
        throw new Error("unexpected crash");
      },
    });

    await dispatcher.dispatch(createJob({ retryCount: 999, maxRetries: 3 }));

    const processed = await dispatcher.processNext();

    expect(processed).toBe(true);
  });

  it("processAll processes multiple jobs", async () => {
    registry.register({
      jobName: "test-job",
      async execute(): Promise<JobResult> {
        return { status: "completed" };
      },
    });

    await dispatcher.dispatch(createJob({ id: "j1" }));
    await dispatcher.dispatch(createJob({ id: "j2" }));
    await dispatcher.dispatch(createJob({ id: "j3" }));

    const count = await dispatcher.processAll();

    expect(count).toBe(3);
    expect(await queue.length()).toBe(0);
  });

  it("processes jobs in priority order", async () => {
    registry.register({
      jobName: "test-job",
      async execute(): Promise<JobResult> {
        return { status: "completed" };
      },
    });

    const results: string[] = [];

    const trackingExecutor = new JobExecutor({
      registry,
    });

    // Override execute to track order
    const originalExecute = trackingExecutor.execute.bind(trackingExecutor);

    vi.spyOn(trackingExecutor, "execute").mockImplementation(async (job) => {
      results.push(job.id);
      return originalExecute(job);
    });

    const d = new JobDispatcher(trackingExecutor);

    d.registerProvider(queue);

    await d.dispatch(createJob({ id: "low", priority: "low" }));
    await d.dispatch(createJob({ id: "high", priority: "high" }));
    await d.dispatch(createJob({ id: "critical", priority: "critical" }));

    await d.processAll();

    expect(results[0]).toBe("critical");
    expect(results[1]).toBe("high");
    expect(results[2]).toBe("low");
  });
});
