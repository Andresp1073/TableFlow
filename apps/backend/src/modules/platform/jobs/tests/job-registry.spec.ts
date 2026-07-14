import { describe, it, expect } from "vitest";
import { JobRegistry } from "../JobRegistry.js";
import type { JobHandler, JobContext, JobResult } from "../types.js";

describe("JobRegistry", () => {
  it("registers and retrieves a handler", () => {
    const registry = new JobRegistry();
    const handler: JobHandler = {
      jobName: "test-job",
      async execute(_context: JobContext): Promise<JobResult> {
        return { status: "completed" };
      },
    };

    registry.register(handler);

    expect(registry.hasHandler("test-job")).toBe(true);
    expect(registry.getHandler("test-job")).toBe(handler);
  });

  it("returns null for unregistered handler", () => {
    const registry = new JobRegistry();

    expect(registry.getHandler("nonexistent")).toBeNull();
    expect(registry.hasHandler("nonexistent")).toBe(false);
  });

  it("unregisters a handler", () => {
    const registry = new JobRegistry();
    const handler: JobHandler = {
      jobName: "temp-job",
      async execute(): Promise<JobResult> {
        return { status: "completed" };
      },
    };

    registry.register(handler);
    registry.unregister("temp-job");

    expect(registry.hasHandler("temp-job")).toBe(false);
  });

  it("lists all registered handler names", () => {
    const registry = new JobRegistry();
    const handlerA: JobHandler = { jobName: "job-a", async execute(): Promise<JobResult> { return { status: "completed" }; } };
    const handlerB: JobHandler = { jobName: "job-b", async execute(): Promise<JobResult> { return { status: "completed" }; } };

    registry.register(handlerA);
    registry.register(handlerB);

    const names = registry.listHandlers();

    expect(names).toHaveLength(2);
    expect(names).toContain("job-a");
    expect(names).toContain("job-b");
  });

  it("clear removes all handlers", () => {
    const registry = new JobRegistry();
    const handler: JobHandler = { jobName: "job", async execute(): Promise<JobResult> { return { status: "completed" }; } };

    registry.register(handler);
    registry.clear();

    expect(registry.count()).toBe(0);
    expect(registry.listHandlers()).toHaveLength(0);
  });

  it("count returns the number of registered handlers", () => {
    const registry = new JobRegistry();
    const handler: JobHandler = { jobName: "job", async execute(): Promise<JobResult> { return { status: "completed" }; } };

    expect(registry.count()).toBe(0);

    registry.register(handler);

    expect(registry.count()).toBe(1);
  });
});
