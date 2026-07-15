import type {
  QualityGateConfig,
  QualityGateType,
  QualityGateResult,
  QualityGateStatus,
  QualityGateSeverity,
  PipelineStageResult,
} from "./types.js";
import { QUALITY_GATE_TYPES } from "./types.js";
import { PipelineValidationError } from "./errors.js";

export class QualityGate {
  readonly type: QualityGateType;
  readonly name: string;
  readonly description: string;
  readonly severity: QualityGateSeverity;
  readonly required: boolean;
  readonly blocking: boolean;
  readonly threshold?: number;
  readonly maxWarnings?: number;
  readonly maxErrors?: number;
  readonly minCoverage?: number;
  readonly timeoutMs: number;

  constructor(config: QualityGateConfig) {
    if (!QUALITY_GATE_TYPES.includes(config.type)) {
      throw new PipelineValidationError(`Invalid quality gate type: ${config.type}`, []);
    }

    this.type = config.type;
    this.name = config.name;
    this.description = config.description ?? "";
    this.severity = config.severity;
    this.required = config.required;
    this.blocking = config.blocking;
    this.threshold = config.threshold;
    this.maxWarnings = config.maxWarnings;
    this.maxErrors = config.maxErrors;
    this.minCoverage = config.minCoverage;
    this.timeoutMs = config.timeoutMs ?? 60_000;
  }

  evaluate(stageResult: PipelineStageResult): QualityGateResult {
    const errors = QualityGate.countErrors(stageResult);
    const warnings = QualityGate.countWarnings(stageResult);

    const status = this.determineStatus(errors, warnings);

    return {
      type: this.type,
      name: this.name,
      status,
      severity: this.severity,
      required: this.required,
      blocking: this.blocking,
      errors,
      warnings,
      score: this.calculateScore(stageResult),
      details: {
        stageType: stageResult.type,
        stageStatus: stageResult.status,
        threshold: this.threshold,
        minCoverage: this.minCoverage,
        maxErrors: this.maxErrors,
        maxWarnings: this.maxWarnings,
      },
      startedAt: stageResult.startedAt,
      completedAt: stageResult.completedAt,
      durationMs: stageResult.durationMs,
    };
  }

  private determineStatus(errors: number, warnings: number): QualityGateStatus {
    if (this.maxErrors !== undefined && errors > this.maxErrors) {
      return "failed";
    }

    if (this.maxWarnings !== undefined && warnings > this.maxWarnings) {
      return "failed";
    }

    if (this.maxErrors !== undefined || this.maxWarnings !== undefined) {
      return "passed";
    }

    return "passed";
  }

  private calculateScore(stageResult: PipelineStageResult): number | undefined {
    if (this.type === "coverage" && this.minCoverage !== undefined && stageResult.output?.coverage !== undefined) {
      return Number(stageResult.output.coverage);
    }

    if (this.threshold !== undefined && stageResult.output?.score !== undefined) {
      return Number(stageResult.output.score);
    }

    return undefined;
  }

  private static countErrors(stageResult: PipelineStageResult): number {
    if (stageResult.output?.errors !== undefined) {
      return Number(stageResult.output.errors);
    }
    return stageResult.status === "failed" ? 1 : 0;
  }

  private static countWarnings(stageResult: PipelineStageResult): number {
    if (stageResult.output?.warnings !== undefined) {
      return Number(stageResult.output.warnings);
    }
    return 0;
  }
}

export class QualityGateEvaluator {
  private readonly gates: Map<QualityGateType, QualityGate> = new Map();

  register(gate: QualityGate): void {
    this.gates.set(gate.type, gate);
  }

  registerMany(gates: QualityGate[]): void {
    for (const gate of gates) {
      this.register(gate);
    }
  }

  getGate(type: QualityGateType): QualityGate | undefined {
    return this.gates.get(type);
  }

  evaluateGates(
    stageResult: PipelineStageResult,
    gateTypes: QualityGateType[],
  ): QualityGateResult[] {
    const results: QualityGateResult[] = [];

    for (const gateType of gateTypes) {
      const gate = this.gates.get(gateType);
      if (gate) {
        results.push(gate.evaluate(stageResult));
      }
    }

    return results;
  }

  hasBlockingFailures(results: QualityGateResult[]): boolean {
    return results.some((r) => r.blocking && r.status === "failed");
  }

  allRequiredPassed(results: QualityGateResult[]): boolean {
    return results
      .filter((r) => r.required)
      .every((r) => r.status === "passed");
  }
}
