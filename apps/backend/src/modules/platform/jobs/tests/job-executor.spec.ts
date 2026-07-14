import { describe, it, expect, vi } from "vitest";
import { JobExecutor } from "../JobExecutor.js";
import { JobRegistry } from "../JobRegistry.js";
import type { Job, JobHandler, JobContext, JobResult } from "../types.js";

function createJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
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

function createHandler(jobName: string, executeFn: (context: JobContext) => Promise<JobResult>): JobHandler {
  return { jobName, execute: executeFn };
}

describe("JobExecutor", () => {
  it("canExecute returns true when handler is registered", () => {
    const registry = new JobRegistry();
    const executor = new JobExecutor({ registry });

    registry.register(createHandler("test-job", async () => ({ status: "completed" })));

    expect(executor.canExecute(createJob())).toBe(true);
  });

  it("canExecute returns false when handler is not registered", () => {
    const registry = new JobRegistry();
    const executor = new JobExecutor({ registry });

    expect(executor.canExecute(createJob())).toBe(false);
  });

  it("executes a handler and returns completed", async () => {
    const registry = new JobRegistry();
    const executor = new JobExecutor({ registry });
    const fn = vi.fn().mockResolvedValue({ status: "completed" as const });

    registry.register(createHandler("test-job", fn));

    const job = createJob();
    const result = await executor.execute(job);

    expect(result.status).toBe("completed");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("returns failed when no handler is registered", async () => {
    const registry = new JobRegistry();
    const executor = new JobExecutor({ registry });

    const result = await executor.execute(createJob());

    expect(result.status).toBe("failed");
    expect(result.error).toContain("No handler registered");
  });

  it("returns retry when handler throws and retries remain", async () => {
    const registry = new JobRegistry();
    const executor = new JobExecutor({ registry });
    const error = new Error("TimeoutError");

    registry.register(createHandler("test-job", async () => { throw error; }));

    const job = createJob({ retryCount: 0, maxRetries: 3 });
    const result = await executor.execute(job);

    expect(result.status).toBe("retry");
    expect(result.error).toBe("TimeoutError");
    expect(result.retryDelay).toBeGreaterThan(0);
    expect(job.status).toBe("retrying");
  });

  it("returns failed when handler throws and no retries remain", async () => {
    const registry = new JobRegistry();
    const executor = new JobExecutor({ registry });
    const error = new Error("FatalError");

    registry.register(createHandler("test-job", async () => { throw error; }));

    const job = createJob({ retryCount: 3, maxRetries: 3 });
    const result = await executor.execute(job);

    expect(result.status).toBe("failed");
    expect(result.error).toBe("FatalError");
    expect(job.status).toBe("failed");
  });

  it("returns failed when handler returns failed status", async () => {
    const registry = new JobRegistry();
    const executor = new JobExecutor({ registry });

    registry.register(createHandler("test-job", async () => ({
      status: "failed",
      error: "Business error",
    })));

    const job = createJob();
    const result = await executor.execute(job);

    expect(result.status).toBe("failed");
    expect(result.error).toBe("Business error");
    expect(job.status).toBe("failed");
  });

  it("creates context with job, logger, cache, abortSignal", async () => {
    const registry = new JobRegistry();
    const executor = new JobExecutor({ registry });

    let capturedContext: JobContext | undefined;

    registry.register(createHandler("test-job", async (context) => {
      capturedContext = context;
      return { status: "completed" };
    }));

    await executor.execute(createJob());

    expect(capturedContext).toBeDefined();
    expect(capturedContext!.job).toBeDefined();
    expect(capturedContext!.logger).toBeDefined();
    expect(capturedContext!.cache).toBeDefined();
    expect(capturedContext!.abortSignal).toBeDefined();
  });

  it("context setProgress and getProgress work", async () => {
    const registry = new JobRegistry();
    const executor = new JobExecutor({ registry });

    let capturedContext: JobContext | undefined;

    registry.register(createHandler("test-job", async (context) => {
      capturedContext = context;
      context.setProgress(50);
      return { status: "completed" };
    }));

    await executor.execute(createJob());

    expect(capturedContext!.getProgress()).toBe(50);
  });

  it("context setMetadata and getMetadata work", async () => {
    const registry = new JobRegistry();
    const executor = new JobExecutor({ registry });

    let capturedContext: JobContext | undefined;

    registry.register(createHandler("test-job", async (context) => {
      capturedContext = context;
      context.setMetadata("key1", "value1");
      return { status: "completed" };
    }));

    await executor.execute(createJob());

    expect(capturedContext!.getMetadata("key1")).toBe("value1");
  });
});
