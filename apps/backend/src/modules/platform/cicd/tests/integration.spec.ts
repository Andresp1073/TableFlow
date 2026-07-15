import { describe, it, expect, vi } from "vitest";
import { PipelineDefinition } from "../PipelineDefinition.js";
import { PipelineExecutor } from "../PipelineExecutor.js";
import { PipelineStage } from "../PipelineStage.js";
import { PipelineContext } from "../PipelineContext.js";
import { PipelineResult } from "../PipelineResult.js";
import { QualityGate, QualityGateEvaluator } from "../QualityGate.js";
import { ArtifactDefinition } from "../ArtifactDefinition.js";
import { DeploymentTarget, DeploymentTargetFactory } from "../DeploymentTarget.js";
import {
  PipelineError,
  PipelineValidationError,
  StageExecutionError,
  QualityGateFailedError,
  DeploymentError,
  PipelineNotFoundError,
} from "../errors.js";
import {
  createCiCdEvent,
  createPipelineEvent,
  createStageEvent,
  publishCiCdEvent,
} from "../events.js";
import {
  PIPELINE_STAGE_TYPES,
  QUALITY_GATE_TYPES,
  ARTIFACT_TYPES,
  DEPLOYMENT_TARGET_TYPES,
  CICD_PROVIDER_TYPES,
} from "../types.js";
import type { StageHandler } from "../types.js";

describe("Integration - Full Pipeline Lifecycle", () => {
  it("executes a complete successful pipeline", async () => {
    const unitTestHandler: StageHandler = {
      stageType: "unit_tests",
      async execute() {
        return { status: "succeeded", attempt: 1, output: { coverage: 92, errors: 0 } };
      },
    };

    const buildHandler: StageHandler = {
      stageType: "artifact_build",
      async execute() {
        return { status: "succeeded", attempt: 1, output: { artifacts: [] } };
      },
    };

    const publishHandler: StageHandler = {
      stageType: "artifact_publish",
      async execute() {
        return { status: "succeeded", attempt: 1 };
      },
    };

    const qualityGateEvaluator = new QualityGateEvaluator();
    qualityGateEvaluator.register(
      new QualityGate({
        type: "coverage",
        name: "Coverage Gate",
        severity: "critical",
        required: true,
        blocking: true,
        minCoverage: 80,
      }),
    );

    const executor = new PipelineExecutor({
      stageHandlers: [unitTestHandler, buildHandler, publishHandler],
      qualityGateEvaluator,
    });

    const definition = PipelineDefinition.create({
      name: "ci-pipeline",
      version: "1.0.0",
      stages: [
        { type: "unit_tests", name: "Unit Tests", qualityGates: ["coverage"] },
        { type: "artifact_build", name: "Build", dependsOn: ["unit_tests"] },
        { type: "artifact_publish", name: "Publish", dependsOn: ["artifact_build"] },
      ],
    });

    const result = await executor.execute(definition.toConfig());
    expect(result.status).toBe("succeeded");
    expect(result.stages).toHaveLength(3);
    expect(result.stages[0]!.status).toBe("succeeded");
    expect(result.stages[1]!.status).toBe("succeeded");
    expect(result.stages[2]!.status).toBe("succeeded");
  });

  it("handles stage failure with quality gate failure", async () => {
    const handler: StageHandler = {
      stageType: "unit_tests",
      async execute() {
        return { status: "failed", attempt: 1, output: { errors: 5, coverage: 30 } };
      },
    };

    const evaluator = new QualityGateEvaluator();
    evaluator.register(
      new QualityGate({
        type: "coverage",
        name: "Coverage",
        severity: "critical",
        required: true,
        blocking: true,
        minCoverage: 80,
      }),
    );

    const executor = new PipelineExecutor({
      stageHandlers: [handler],
      qualityGateEvaluator: evaluator,
    });

    const result = await executor.execute({
      name: "failing-pipeline",
      version: "1.0.0",
      stages: [{ type: "unit_tests", name: "Tests", qualityGates: ["coverage"] }],
    });

    expect(result.status).toBe("failed");
  });

  it("executes with all artifacts and deployment targets configured", () => {
    const definition = PipelineDefinition.create({
      name: "full-pipeline",
      version: "2.0.0",
      stages: [
        { type: "source_checkout", name: "Checkout" },
        { type: "dependency_restore", name: "Restore", dependsOn: ["source_checkout"] },
        { type: "unit_tests", name: "Tests", dependsOn: ["dependency_restore"] },
        { type: "artifact_build", name: "Build", dependsOn: ["unit_tests"] },
        { type: "artifact_publish", name: "Publish", dependsOn: ["artifact_build"] },
        { type: "deployment", name: "Deploy", dependsOn: ["artifact_publish"] },
      ],
      qualityGates: [
        { type: "compilation", name: "Compiles", severity: "critical", required: true, blocking: true },
        { type: "lint", name: "Lint", severity: "high", required: true, blocking: true, maxErrors: 0 },
        { type: "coverage", name: "Coverage", severity: "high", required: true, blocking: true, minCoverage: 80 },
      ],
      artifacts: [
        { type: "backend_package", name: "Backend", path: "dist/backend.tgz" },
        { type: "docker_image", name: "Docker", path: "tableflow:latest" },
        { type: "openapi_specification", name: "API Spec", path: "docs/openapi.json" },
      ],
      deploymentTargets: [
        { type: "development", name: "Dev", url: "http://localhost:3000", requiredApproval: false },
        { type: "staging", name: "Staging", url: "https://staging.tableflow.com", requiredApproval: true },
        { type: "production", name: "Production", url: "https://tableflow.com", requiredApproval: true },
      ],
      variables: { NODE_ENV: "production" },
      tags: ["release", "stable"],
    });

    expect(definition.stages).toHaveLength(6);
    expect(definition.qualityGates).toHaveLength(3);
    expect(definition.artifacts).toHaveLength(3);
    expect(definition.deploymentTargets).toHaveLength(3);
  });

  it("publishes events through the full lifecycle", async () => {
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
      name: "events-test",
      version: "1.0.0",
      stages: [{ type: "unit_tests", name: "Tests" }],
    });

    expect(events).toEqual([
      "pipeline.started",
      "pipeline.stage_started",
      "pipeline.stage_completed",
      "pipeline.completed",
    ]);
  });

  it("publishes failure events on error", async () => {
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
        throw new Error("Unexpected crash");
      },
    };

    const executor = new PipelineExecutor({
      stageHandlers: [handler],
      eventPublisher: publisher,
    });

    await executor.execute({
      name: "fail-test",
      version: "1.0.0",
      stages: [{ type: "unit_tests", name: "Tests" }],
    });

    expect(events).toContain("pipeline.started");
    expect(events).toContain("pipeline.failed");
  });
});

describe("Integration - Constants and Types", () => {
  it("defines all pipeline stage types", () => {
    expect(PIPELINE_STAGE_TYPES).toHaveLength(10);
    expect(PIPELINE_STAGE_TYPES).toContain("source_checkout");
    expect(PIPELINE_STAGE_TYPES).toContain("dependency_restore");
    expect(PIPELINE_STAGE_TYPES).toContain("static_analysis");
    expect(PIPELINE_STAGE_TYPES).toContain("formatting_validation");
    expect(PIPELINE_STAGE_TYPES).toContain("unit_tests");
    expect(PIPELINE_STAGE_TYPES).toContain("integration_tests");
    expect(PIPELINE_STAGE_TYPES).toContain("security_scan");
    expect(PIPELINE_STAGE_TYPES).toContain("artifact_build");
    expect(PIPELINE_STAGE_TYPES).toContain("artifact_publish");
    expect(PIPELINE_STAGE_TYPES).toContain("deployment");
  });

  it("defines all quality gate types", () => {
    expect(QUALITY_GATE_TYPES).toHaveLength(8);
    expect(QUALITY_GATE_TYPES).toContain("compilation");
    expect(QUALITY_GATE_TYPES).toContain("architecture_validation");
  });

  it("defines all artifact types", () => {
    expect(ARTIFACT_TYPES).toHaveLength(5);
    expect(ARTIFACT_TYPES).toContain("backend_package");
    expect(ARTIFACT_TYPES).toContain("openapi_specification");
  });

  it("defines all deployment target types", () => {
    expect(DEPLOYMENT_TARGET_TYPES).toHaveLength(4);
    expect(DEPLOYMENT_TARGET_TYPES).toContain("development");
    expect(DEPLOYMENT_TARGET_TYPES).toContain("production");
  });

  it("defines all CI/CD provider types", () => {
    expect(CICD_PROVIDER_TYPES).toHaveLength(6);
    expect(CICD_PROVIDER_TYPES).toContain("github_actions");
    expect(CICD_PROVIDER_TYPES).toContain("gitlab_ci");
    expect(CICD_PROVIDER_TYPES).toContain("azure_devops");
    expect(CICD_PROVIDER_TYPES).toContain("jenkins");
    expect(CICD_PROVIDER_TYPES).toContain("circleci");
    expect(CICD_PROVIDER_TYPES).toContain("bitbucket_pipelines");
  });
});

describe("Integration - Error Classes", () => {
  it("creates pipeline errors with codes", () => {
    const error = new PipelineError("Something went wrong", "PIPELINE_ERROR");
    expect(error.message).toBe("Something went wrong");
    expect(error.code).toBe("PIPELINE_ERROR");
    expect(error.name).toBe("PipelineError");
  });

  it("creates validation errors", () => {
    const error = new PipelineValidationError("Invalid config", ["Name required", "Version required"]);
    expect(error.code).toBe("PIPELINE_VALIDATION_ERROR");
    expect(error.validationErrors).toHaveLength(2);
  });

  it("creates stage execution errors", () => {
    const error = new StageExecutionError("unit_tests", "Tests failed", 2);
    expect(error.stageType).toBe("unit_tests");
    expect(error.attempt).toBe(2);
  });

  it("creates quality gate errors", () => {
    const error = new QualityGateFailedError("coverage", "Coverage below threshold");
    expect(error.gateType).toBe("coverage");
  });

  it("creates deployment errors", () => {
    const error = new DeploymentError("production", "Deployment failed");
    expect(error.targetType).toBe("production");
  });

  it("creates not found errors", () => {
    const error = new PipelineNotFoundError("run-123");
    expect(error.runId).toBe("run-123");
    expect(error.message).toContain("run-123");
  });
});

describe("Integration - Event Helpers", () => {
  it("creates CI/CD events", () => {
    const event = createCiCdEvent("pipeline.started", "my-pipeline", "run-1", { version: "1.0" });
    expect(event.type).toBe("pipeline.started");
    expect(event.payload.pipelineName).toBe("my-pipeline");
    expect(event.payload.runId).toBe("run-1");
  });

  it("creates pipeline events with status", () => {
    const event = createPipelineEvent("pipeline.completed", "my-pipeline", "run-1", "succeeded");
    expect(event.payload.status).toBe("succeeded");
  });

  it("creates stage events", () => {
    const event = createStageEvent("pipeline.stage_completed", "my-pipeline", "run-1", "unit_tests", "succeeded");
    expect(event.payload.stageType).toBe("unit_tests");
    expect(event.payload.stageStatus).toBe("succeeded");
  });

  it("publishes events silently when no publisher", async () => {
    const logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn(), fatal: vi.fn(), log: vi.fn(), child: vi.fn() } as any;
    await publishCiCdEvent(undefined, logger, "pipeline.started", "test", "run-1");
    expect(logger.error).not.toHaveBeenCalled();
  });
});
