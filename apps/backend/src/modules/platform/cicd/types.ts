import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";

export type PipelineStageType =
  | "source_checkout"
  | "dependency_restore"
  | "static_analysis"
  | "formatting_validation"
  | "unit_tests"
  | "integration_tests"
  | "security_scan"
  | "artifact_build"
  | "artifact_publish"
  | "deployment";

export const PIPELINE_STAGE_TYPES: PipelineStageType[] = [
  "source_checkout",
  "dependency_restore",
  "static_analysis",
  "formatting_validation",
  "unit_tests",
  "integration_tests",
  "security_scan",
  "artifact_build",
  "artifact_publish",
  "deployment",
];

export type PipelineStageStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "skipped"
  | "cancelled";

export type QualityGateType =
  | "compilation"
  | "lint"
  | "formatting"
  | "unit_tests"
  | "coverage"
  | "security_scan"
  | "dependency_audit"
  | "architecture_validation";

export const QUALITY_GATE_TYPES: QualityGateType[] = [
  "compilation",
  "lint",
  "formatting",
  "unit_tests",
  "coverage",
  "security_scan",
  "dependency_audit",
  "architecture_validation",
];

export type QualityGateStatus =
  | "pending"
  | "passed"
  | "failed"
  | "skipped"
  | "error";

export type QualityGateSeverity = "critical" | "high" | "medium" | "low" | "info";

export type ArtifactType =
  | "backend_package"
  | "docker_image"
  | "documentation"
  | "coverage_report"
  | "openapi_specification";

export const ARTIFACT_TYPES: ArtifactType[] = [
  "backend_package",
  "docker_image",
  "documentation",
  "coverage_report",
  "openapi_specification",
];

export type ArtifactStatus =
  | "pending"
  | "building"
  | "published"
  | "failed"
  | "archived";

export type DeploymentTargetType =
  | "development"
  | "testing"
  | "staging"
  | "production";

export const DEPLOYMENT_TARGET_TYPES: DeploymentTargetType[] = [
  "development",
  "testing",
  "staging",
  "production",
];

export type DeploymentStatus =
  | "pending"
  | "deploying"
  | "deployed"
  | "failed"
  | "rolled_back"
  | "cancelled";

export type CiCdProviderType =
  | "github_actions"
  | "gitlab_ci"
  | "azure_devops"
  | "jenkins"
  | "circleci"
  | "bitbucket_pipelines";

export const CICD_PROVIDER_TYPES: CiCdProviderType[] = [
  "github_actions",
  "gitlab_ci",
  "azure_devops",
  "jenkins",
  "circleci",
  "bitbucket_pipelines",
];

export type PipelineTriggerType = "manual" | "scheduled" | "webhook" | "event";

export interface PipelineStageConfig {
  type: PipelineStageType;
  name: string;
  description?: string;
  dependsOn?: PipelineStageType[];
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  allowFailure?: boolean;
  environment?: Record<string, string>;
  qualityGates?: QualityGateType[];
}

export interface PipelineTrigger {
  type: PipelineTriggerType;
  config?: Record<string, unknown>;
}

export interface QualityGateConfig {
  type: QualityGateType;
  name: string;
  description?: string;
  severity: QualityGateSeverity;
  required: boolean;
  threshold?: number;
  maxWarnings?: number;
  maxErrors?: number;
  minCoverage?: number;
  blocking: boolean;
  timeoutMs?: number;
}

export interface ArtifactConfig {
  type: ArtifactType;
  name: string;
  description?: string;
  path: string;
  retentionDays?: number;
  tags?: string[];
  compress?: boolean;
}

export interface DeploymentTargetConfig {
  type: DeploymentTargetType;
  name: string;
  description?: string;
  url?: string;
  requiredApproval: boolean;
  approvers?: string[];
  allowedBranches?: string[];
  requiredChecks?: string[];
  maxConcurrentDeployments?: number;
  autoRollback?: boolean;
  timeoutMs?: number;
}

export interface PipelineDefinitionConfig {
  name: string;
  description?: string;
  version: string;
  stages: PipelineStageConfig[];
  triggers?: PipelineTrigger[];
  variables?: Record<string, string>;
  tags?: string[];
  timeoutMs?: number;
  qualityGates?: QualityGateConfig[];
  artifacts?: ArtifactConfig[];
  deploymentTargets?: DeploymentTargetConfig[];
}

export interface StageExecutionState {
  status: PipelineStageStatus;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  attempt: number;
  error?: string;
  output?: Record<string, unknown>;
}

export interface PipelineContextData {
  pipelineId: string;
  pipelineName: string;
  version: string;
  runId: string;
  runNumber: number;
  startedAt: Date;
  triggeredBy: string;
  triggerType: PipelineTriggerType;
  branch?: string;
  commitSha?: string;
  commitMessage?: string;
  author?: string;
  environment?: string;
  variables: Map<string, string>;
  metadata: Record<string, unknown>;
  stages: Map<PipelineStageType, StageExecutionState>;
}

export interface PipelineStageResult {
  type: PipelineStageType;
  name: string;
  status: PipelineStageStatus;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  attempt: number;
  error?: string;
  output?: Record<string, unknown>;
}

export interface QualityGateResult {
  type: QualityGateType;
  name: string;
  status: QualityGateStatus;
  severity: QualityGateSeverity;
  required: boolean;
  blocking: boolean;
  score?: number;
  errors: number;
  warnings: number;
  details?: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
}

export interface ArtifactResult {
  id: string;
  type: ArtifactType;
  name: string;
  version: string;
  status: ArtifactStatus;
  path: string;
  sizeBytes?: number;
  checksum?: string;
  publishedAt?: Date;
  retentionExpiresAt?: Date;
  metadata: Record<string, unknown>;
}

export interface DeploymentResult {
  type: DeploymentTargetType;
  name: string;
  status: DeploymentStatus;
  url?: string;
  deployedAt?: Date;
  deployedBy?: string;
  version?: string;
  rollbackVersion?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface PipelineResultData {
  pipelineId: string;
  runId: string;
  runNumber: number;
  status: PipelineStageStatus;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  stages: PipelineStageResult[];
  qualityGates: QualityGateResult[];
  artifacts: ArtifactResult[];
  error?: string;
  metadata: Record<string, unknown>;
}

export interface CiCdProvider {
  readonly name: string;
  readonly providerType: CiCdProviderType;
  executePipeline(definition: PipelineDefinitionConfig, context: PipelineContextData): Promise<PipelineResultData>;
  cancelPipeline(runId: string): Promise<void>;
  getPipelineStatus(runId: string): Promise<PipelineStageStatus>;
}

export interface PipelineExecutorInterface {
  execute(definition: PipelineDefinitionConfig, context?: Partial<PipelineContextData>): Promise<PipelineResultData>;
  cancel(runId: string): Promise<void>;
  getStatus(runId: string): Promise<PipelineResultData | null>;
}

export interface StageHandler {
  readonly stageType: PipelineStageType;
  execute(context: PipelineContextData, logger?: Logger): Promise<StageExecutionState>;
}

export type CiCdEventType =
  | "pipeline.started"
  | "pipeline.completed"
  | "pipeline.failed"
  | "pipeline.stage_started"
  | "pipeline.stage_completed"
  | "pipeline.stage_failed"
  | "quality_gate.passed"
  | "quality_gate.failed"
  | "artifact.published"
  | "artifact.failed"
  | "deployment.requested"
  | "deployment.started"
  | "deployment.completed"
  | "deployment.failed";

export interface CiCdManagerOptions {
  logger?: Logger;
  eventPublisher?: EventPublisher;
  stageHandlers?: StageHandler[];
  defaultTimeoutMs?: number;
}
