import { describe, it, expect, vi } from "vitest";
import { PipelineDefinition } from "../PipelineDefinition.js";
import { PipelineStage } from "../PipelineStage.js";
import { PipelineContext } from "../PipelineContext.js";
import { PipelineResult } from "../PipelineResult.js";
import { PipelineExecutor } from "../PipelineExecutor.js";
import { PipelineValidationError } from "../errors.js";
import type { PipelineDefinitionConfig, StageHandler, StageExecutionState } from "../types.js";

describe("PipelineDefinition", () => {
  const validConfig: PipelineDefinitionConfig = {
    name: "test-pipeline",
    version: "1.0.0",
    stages: [
      { type: "unit_tests", name: "Unit Tests" },
      { type: "artifact_build", name: "Build", dependsOn: ["unit_tests"] },
    ],
  };

  it("creates a valid pipeline definition", () => {
    const definition = PipelineDefinition.create(validConfig);
    expect(definition.name).toBe("test-pipeline");
    expect(definition.version).toBe("1.0.0");
    expect(definition.stages).toHaveLength(2);
  });

  it("throws on empty name", () => {
    expect(() =>
      PipelineDefinition.create({ ...validConfig, name: "" }),
    ).toThrow(PipelineValidationError);
  });

  it("throws on missing version", () => {
    expect(() =>
      PipelineDefinition.create({ ...validConfig, version: "" }),
    ).toThrow(PipelineValidationError);
  });

  it("throws on empty stages", () => {
    expect(() =>
      PipelineDefinition.create({ ...validConfig, stages: [] }),
    ).toThrow(PipelineValidationError);
  });

  it("throws on invalid stage type", () => {
    expect(() =>
      PipelineDefinition.create({
        ...validConfig,
        stages: [{ type: "invalid_stage" as never, name: "Bad" }],
      }),
    ).toThrow(PipelineValidationError);
  });

  it("throws on duplicate stage types", () => {
    expect(() =>
      PipelineDefinition.create({
        ...validConfig,
        stages: [
          { type: "unit_tests", name: "UT1" },
          { type: "unit_tests", name: "UT2" },
        ],
      }),
    ).toThrow(PipelineValidationError);
  });

  it("throws on invalid quality gate type", () => {
    expect(() =>
      PipelineDefinition.create({
        ...validConfig,
        qualityGates: [{ type: "invalid_gate" as never, name: "Bad", severity: "critical", required: true, blocking: true }],
      }),
    ).toThrow(PipelineValidationError);
  });

  it("throws on invalid artifact type", () => {
    expect(() =>
      PipelineDefinition.create({
        ...validConfig,
        artifacts: [{ type: "invalid_artifact" as never, name: "Bad", path: "/tmp" }],
      }),
    ).toThrow(PipelineValidationError);
  });

  it("throws on invalid deployment target type", () => {
    expect(() =>
      PipelineDefinition.create({
        ...validConfig,
        deploymentTargets: [{ type: "invalid_target" as never, name: "Bad" }],
      }),
    ).toThrow(PipelineValidationError);
  });

  it("returns a stage by type", () => {
    const definition = PipelineDefinition.create(validConfig);
    const stage = definition.getStage("unit_tests");
    expect(stage).toBeDefined();
    expect(stage!.name).toBe("Unit Tests");
  });

  it("returns undefined for non-existent stage", () => {
    const definition = PipelineDefinition.create(validConfig);
    expect(definition.getStage("deployment")).toBeUndefined();
  });

  it("converts to config object", () => {
    const definition = PipelineDefinition.create(validConfig);
    const config = definition.toConfig();
    expect(config.name).toBe("test-pipeline");
    expect(config.stages).toHaveLength(2);
  });
});

describe("PipelineStage", () => {
  it("creates a stage with defaults", () => {
    const stage = new PipelineStage({ type: "unit_tests", name: "Tests" });
    expect(stage.type).toBe("unit_tests");
    expect(stage.timeoutMs).toBe(600_000);
    expect(stage.retryCount).toBe(0);
    expect(stage.allowFailure).toBe(false);
  });

  it("checks dependency satisfaction", () => {
    const stage = new PipelineStage({
      type: "artifact_build",
      name: "Build",
      dependsOn: ["unit_tests"],
    });

    const statuses = new Map();
    statuses.set("unit_tests", "succeeded");
    expect(stage.canExecute(statuses)).toBe(true);

    statuses.set("unit_tests", "failed");
    expect(stage.canExecute(statuses)).toBe(false);

    statuses.set("unit_tests", "pending");
    expect(stage.canExecute(statuses)).toBe(false);
  });

  it("identifies final statuses", () => {
    const stage = new PipelineStage({ type: "unit_tests", name: "Tests" });
    expect(stage.isFinalStatus("succeeded")).toBe(true);
    expect(stage.isFinalStatus("failed")).toBe(true);
    expect(stage.isFinalStatus("cancelled")).toBe(true);
    expect(stage.isFinalStatus("running")).toBe(false);
    expect(stage.isFinalStatus("pending")).toBe(false);
  });
});

describe("PipelineContext", () => {
  it("creates with defaults", () => {
    const context = PipelineContext.create();
    expect(context.runId).toBeDefined();
    expect(context.triggerType).toBe("manual");
    expect(context.triggeredBy).toBe("system");
    expect(context.stages.size).toBe(0);
  });

  it("creates with overrides", () => {
    const context = PipelineContext.create({
      pipelineName: "my-pipeline",
      branch: "main",
      triggeredBy: "developer",
      triggerType: "webhook",
    });
    expect(context.pipelineName).toBe("my-pipeline");
    expect(context.branch).toBe("main");
    expect(context.triggeredBy).toBe("developer");
    expect(context.triggerType).toBe("webhook");
  });

  it("manages stage state", () => {
    const context = PipelineContext.create();
    const state: StageExecutionState = { status: "running", attempt: 1 };
    context.setStageState("unit_tests", state);

    expect(context.getStageState("unit_tests")).toEqual(state);
    expect(context.getStageStatus("unit_tests")).toBe("running");
    expect(context.getStageStatus("deployment")).toBeUndefined();
  });

  it("converts to data", () => {
    const context = PipelineContext.create({ pipelineName: "test" });
    const data = context.toData();
    expect(data.pipelineName).toBe("test");
    expect(data.runId).toBe(context.runId);
  });
});

describe("PipelineResult", () => {
  it("creates a result", () => {
    const now = new Date();
    const result = PipelineResult.create({
      pipelineId: "pl-1",
      runId: "run-1",
      runNumber: 1,
      status: "succeeded",
      startedAt: now,
      completedAt: now,
      durationMs: 1000,
      stages: [],
      qualityGates: [],
      artifacts: [],
      metadata: {},
    });

    expect(result.isSuccess()).toBe(true);
    expect(result.isFailed()).toBe(false);
    expect(result.isCancelled()).toBe(false);
  });

  it("detects failures", () => {
    const now = new Date();
    const result = PipelineResult.create({
      pipelineId: "pl-1",
      runId: "run-1",
      runNumber: 1,
      status: "failed",
      startedAt: now,
      completedAt: now,
      durationMs: 500,
      stages: [],
      qualityGates: [],
      artifacts: [],
      error: "Something went wrong",
      metadata: {},
    });

    expect(result.isSuccess()).toBe(false);
    expect(result.isFailed()).toBe(true);
    expect(result.error).toBe("Something went wrong");
  });

  it("detects blocking failures from quality gates", () => {
    const now = new Date();
    const result = PipelineResult.create({
      pipelineId: "pl-1",
      runId: "run-1",
      runNumber: 1,
      status: "failed",
      startedAt: now,
      completedAt: now,
      durationMs: 500,
      stages: [],
      qualityGates: [
        { type: "lint", name: "Lint", status: "failed", severity: "critical", required: true, blocking: true, errors: 5, warnings: 0 },
      ],
      artifacts: [],
      metadata: {},
    });

    expect(result.hasBlockingFailures()).toBe(true);
  });

  it("finds failed stages", () => {
    const now = new Date();
    const result = PipelineResult.create({
      pipelineId: "pl-1",
      runId: "run-1",
      runNumber: 1,
      status: "failed",
      startedAt: now,
      completedAt: now,
      durationMs: 500,
      stages: [
        { type: "unit_tests", name: "Tests", status: "failed", attempt: 1 },
        { type: "artifact_build", name: "Build", status: "succeeded", attempt: 1 },
      ],
      qualityGates: [],
      artifacts: [],
      metadata: {},
    });

    expect(result.getFailedStages()).toHaveLength(1);
    expect(result.getFailedStages()[0]!.type).toBe("unit_tests");
  });

  it("converts to data", () => {
    const now = new Date();
    const result = PipelineResult.create({
      pipelineId: "pl-1",
      runId: "run-1",
      runNumber: 1,
      status: "succeeded",
      startedAt: now,
      completedAt: now,
      durationMs: 1000,
      stages: [],
      qualityGates: [],
      artifacts: [],
      metadata: {},
    });

    const data = result.toData();
    expect(data.pipelineId).toBe("pl-1");
    expect(data.status).toBe("succeeded");
  });
});

describe("PipelineExecutor", () => {
  it("executes stages that have handlers", async () => {
    const handler: StageHandler = {
      stageType: "unit_tests",
      async execute() {
        return { status: "succeeded", attempt: 1 };
      },
    };

    const executor = new PipelineExecutor({ stageHandlers: [handler] });

    const result = await executor.execute({
      name: "test",
      version: "1.0.0",
      stages: [{ type: "unit_tests", name: "Unit Tests" }],
    });

    expect(result.status).toBe("succeeded");
    expect(result.stages).toHaveLength(1);
    expect(result.stages[0]!.status).toBe("succeeded");
  });

  it("handles stage failures", async () => {
    const handler: StageHandler = {
      stageType: "unit_tests",
      async execute() {
        return { status: "failed", attempt: 1, error: "Tests failed" };
      },
    };

    const executor = new PipelineExecutor({ stageHandlers: [handler] });

    const result = await executor.execute({
      name: "test",
      version: "1.0.0",
      stages: [{ type: "unit_tests", name: "Unit Tests" }],
    });

    expect(result.status).toBe("failed");
    expect(result.stages[0]!.error).toBe("Tests failed");
  });

  it("allows failure when configured", async () => {
    const handler: StageHandler = {
      stageType: "unit_tests",
      async execute() {
        return { status: "failed", attempt: 1, error: "Tests failed" };
      },
    };

    const executor = new PipelineExecutor({ stageHandlers: [handler] });

    const result = await executor.execute({
      name: "test",
      version: "1.0.0",
      stages: [{ type: "unit_tests", name: "Unit Tests", allowFailure: true }],
    });

    expect(result.status).toBe("succeeded");
  });

  it("skips stages when dependencies are not met", async () => {
    const handler: StageHandler = {
      stageType: "unit_tests",
      async execute() {
        return { status: "failed", attempt: 1, error: "Failed" };
      },
    };

    const buildHandler: StageHandler = {
      stageType: "artifact_build",
      async execute() {
        return { status: "succeeded", attempt: 1 };
      },
    };

    const executor = new PipelineExecutor({ stageHandlers: [handler, buildHandler] });

    const result = await executor.execute({
      name: "test",
      version: "1.0.0",
      stages: [
        { type: "unit_tests", name: "Tests" },
        { type: "artifact_build", name: "Build", dependsOn: ["unit_tests"] },
      ],
    });

    expect(result.stages[0]!.status).toBe("failed");
    expect(result.stages[1]!.status).toBe("skipped");
  });

  it("cancels a running pipeline", async () => {
    const executor = new PipelineExecutor();

    const handler: StageHandler = {
      stageType: "unit_tests",
      async execute() {
        return { status: "succeeded", attempt: 1 };
      },
    };
    executor.registerStageHandler(handler);

    const result = await executor.execute({
      name: "test",
      version: "1.0.0",
      stages: [{ type: "unit_tests", name: "Tests" }],
    });

    await executor.cancel(result.runId);
    const cancelled = executor.getStatus(result.runId);
    expect(cancelled!.status).toBe("cancelled");
  });

  it("throws when cancelling unknown pipeline", async () => {
    const executor = new PipelineExecutor();
    await expect(executor.cancel("unknown")).rejects.toThrow();
  });

  it("returns null for unknown pipeline status", () => {
    const executor = new PipelineExecutor();
    expect(executor.getStatus("unknown")).toBeNull();
  });

  it("retries failed stages", async () => {
    let attempts = 0;

    const handler: StageHandler = {
      stageType: "unit_tests",
      async execute() {
        attempts++;
        if (attempts < 3) {
          return { status: "failed", attempt: attempts, error: `Attempt ${attempts} failed` };
        }
        return { status: "succeeded", attempt: attempts };
      },
    };

    const executor = new PipelineExecutor({ stageHandlers: [handler] });

    const result = await executor.execute({
      name: "test",
      version: "1.0.0",
      stages: [{ type: "unit_tests", name: "Tests", retryCount: 3, retryDelayMs: 10 }],
    });

    expect(result.status).toBe("succeeded");
    expect(attempts).toBe(3);
  });

  it("publishes pipeline lifecycle events", async () => {
    const events: string[] = [];
    const publisher = {
      async publish(event: { type: string }) {
        events.push(event.type);
      },
      async publishMany() {},
    };

    const handler: StageHandler = {
      stageType: "unit_tests",
      async execute() {
        return { status: "succeeded", attempt: 1 };
      },
    };

    const executor = new PipelineExecutor({
      stageHandlers: [handler],
      eventPublisher: publisher,
    });

    await executor.execute({
      name: "event-test",
      version: "1.0.0",
      stages: [{ type: "unit_tests", name: "Tests" }],
    });

    expect(events).toContain("pipeline.started");
    expect(events).toContain("pipeline.stage_started");
    expect(events).toContain("pipeline.stage_completed");
    expect(events).toContain("pipeline.completed");
  });
});
