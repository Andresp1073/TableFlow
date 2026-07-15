import { describe, it, expect } from "vitest";
import { QualityGate, QualityGateEvaluator } from "../QualityGate.js";
import { PipelineValidationError } from "../errors.js";
import type { PipelineStageResult } from "../types.js";

describe("QualityGate", () => {
  it("creates a quality gate", () => {
    const gate = new QualityGate({
      type: "lint",
      name: "ESLint",
      severity: "high",
      required: true,
      blocking: true,
      maxErrors: 0,
    });

    expect(gate.type).toBe("lint");
    expect(gate.blocking).toBe(true);
    expect(gate.required).toBe(true);
  });

  it("throws on invalid type", () => {
    expect(() =>
      new QualityGate({
        type: "invalid_type" as never,
        name: "Bad",
        severity: "critical",
        required: true,
        blocking: true,
      }),
    ).toThrow(PipelineValidationError);
  });

  it("passes when errors are within limits", () => {
    const gate = new QualityGate({
      type: "lint",
      name: "ESLint",
      severity: "high",
      required: true,
      blocking: true,
      maxErrors: 5,
      maxWarnings: 10,
    });

    const stageResult: PipelineStageResult = {
      type: "static_analysis",
      name: "Lint",
      status: "succeeded",
      attempt: 1,
      output: { errors: 2, warnings: 3 },
    };

    const result = gate.evaluate(stageResult);
    expect(result.status).toBe("passed");
    expect(result.errors).toBe(2);
    expect(result.warnings).toBe(3);
  });

  it("fails when errors exceed max", () => {
    const gate = new QualityGate({
      type: "lint",
      name: "ESLint",
      severity: "high",
      required: true,
      blocking: true,
      maxErrors: 0,
    });

    const stageResult: PipelineStageResult = {
      type: "static_analysis",
      name: "Lint",
      status: "failed",
      attempt: 1,
      output: { errors: 3 },
    };

    const result = gate.evaluate(stageResult);
    expect(result.status).toBe("failed");
    expect(result.errors).toBe(3);
  });

  it("fails when warnings exceed max", () => {
    const gate = new QualityGate({
      type: "lint",
      name: "ESLint",
      severity: "medium",
      required: false,
      blocking: false,
      maxWarnings: 5,
    });

    const stageResult: PipelineStageResult = {
      type: "static_analysis",
      name: "Lint",
      status: "succeeded",
      attempt: 1,
      output: { warnings: 10 },
    };

    const result = gate.evaluate(stageResult);
    expect(result.status).toBe("failed");
    expect(result.warnings).toBe(10);
  });

  it("calculates coverage score", () => {
    const gate = new QualityGate({
      type: "coverage",
      name: "Coverage",
      severity: "critical",
      required: true,
      blocking: true,
      minCoverage: 80,
    });

    const stageResult: PipelineStageResult = {
      type: "unit_tests",
      name: "Tests",
      status: "succeeded",
      attempt: 1,
      output: { coverage: 85 },
    };

    const result = gate.evaluate(stageResult);
    expect(result.score).toBe(85);
  });
});

describe("QualityGateEvaluator", () => {
  it("registers and evaluates gates", () => {
    const evaluator = new QualityGateEvaluator();

    const gate = new QualityGate({
      type: "lint",
      name: "Lint",
      severity: "high",
      required: true,
      blocking: true,
    });

    evaluator.register(gate);

    const stageResult: PipelineStageResult = {
      type: "static_analysis",
      name: "Lint",
      status: "succeeded",
      attempt: 1,
    };

    const results = evaluator.evaluateGates(stageResult, ["lint"]);
    expect(results).toHaveLength(1);
    expect(results[0]!.type).toBe("lint");
  });

  it("detects blocking failures", () => {
    const evaluator = new QualityGateEvaluator();

    const gate = new QualityGate({
      type: "lint",
      name: "Lint",
      severity: "critical",
      required: true,
      blocking: true,
      maxErrors: 0,
    });

    evaluator.register(gate);

    const results = evaluator.evaluateGates(
      { type: "static_analysis", name: "Lint", status: "failed", attempt: 1, output: { errors: 1 } },
      ["lint"],
    );

    expect(evaluator.hasBlockingFailures(results)).toBe(true);
  });

  it("checks all required passed", () => {
    const evaluator = new QualityGateEvaluator();

    evaluator.registerMany([
      new QualityGate({ type: "lint", name: "Lint", severity: "high", required: true, blocking: false }),
      new QualityGate({ type: "unit_tests", name: "Tests", severity: "high", required: true, blocking: false }),
    ]);

    const results = evaluator.evaluateGates(
      { type: "unit_tests", name: "Tests", status: "succeeded", attempt: 1 },
      ["lint", "unit_tests"],
    );

    expect(evaluator.allRequiredPassed(results)).toBe(true);
  });

  it("retrieves a registered gate", () => {
    const evaluator = new QualityGateEvaluator();
    const gate = new QualityGate({ type: "lint", name: "Lint", severity: "high", required: true, blocking: true });
    evaluator.register(gate);

    expect(evaluator.getGate("lint")).toBeDefined();
    expect(evaluator.getGate("unit_tests")).toBeUndefined();
  });
});
