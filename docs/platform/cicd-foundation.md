# CI/CD Foundation

## Architecture

The CI/CD Foundation provides a provider-agnostic pipeline orchestration system for the TableFlow platform. It follows Clean Architecture and Dependency Inversion principles, enabling future integration with any CI provider without changing business logic.

```
┌──────────────────────────────────────────────────────────────────┐
│                        Business Modules                           │
│                    (depend only on pipeline types)                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                     PipelineExecutorInterface                       │
│                    (interface — dependency inversion)                │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                        PipelineExecutor                             │
│   ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────────┐   │
│   │ Pipeline │ │ Pipeline │ │  Quality   │ │   Stage Handlers │   │
│   │Stage     │ │ Context  │ │Gate        │ │   (per stage)    │   │
│   └──────────┘ └──────────┘ └────────────┘ └──────────────────┘   │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                      Future CI Providers                            │
│  GitHub Actions | GitLab CI | Azure DevOps | Jenkins | CircleCI   │
└──────────────────────────────────────────────────────────────────┘
```

### Module Location

```
apps/backend/src/modules/platform/cicd/
├── index.ts                    # Barrel export
├── types.ts                    # All types and interfaces
├── PipelineDefinition.ts       # Pipeline definition with validation
├── PipelineStage.ts            # Stage configuration and dependency resolution
├── PipelineContext.ts          # Execution context with state tracking
├── PipelineExecutor.ts         # Orchestration engine
├── PipelineResult.ts           # Immutable result object
├── ArtifactDefinition.ts       # Artifact value object
├── QualityGate.ts              # Quality gate evaluator
├── DeploymentTarget.ts         # Deployment target abstraction
├── errors.ts                   # Custom error classes
├── events.ts                   # Event creation and publishing helpers
└── tests/                      # Test suite
```

### Core Components

| Component | Responsibility |
|---|---|
| **PipelineDefinition** | Immutable configuration with validation, typed stage/gate/artifact/target accessors |
| **PipelineStage** | Stage configuration, dependency resolution, status finality checks |
| **PipelineContext** | Execution state, stage status tracking, run metadata |
| **PipelineExecutor** | Orchestrates stage execution, retry logic, quality gate evaluation, event publishing |
| **PipelineResult** | Immutable execution result with failure analysis helpers |
| **ArtifactDefinition** | Artifact metadata and result factory |
| **QualityGate** | Configurable threshold evaluation with pass/fail determination |
| **QualityGateEvaluator** | Registry of gates with batch evaluation and blocking failure detection |
| **DeploymentTarget** | Environment configuration with branch authorization and approval checks |

## Pipeline Lifecycle

```
  ┌──────────┐
  │  Define  │  → PipelineDefinition created with stages, gates, artifacts
  └────┬─────┘
       │
  ┌────▼─────┐
  │  Start   │  → PipelineStarted event published, context initialized
  └────┬─────┘
       │
  ┌────▼────────┐
  │ Stage Exec  │  → For each stage (respecting dependencies):
  │             │      ┌────────────┐
  │             │      │ CanExecute │ → Check dependency statuses
  │             │      └──────┬─────┘
  │             │             │
  │             │      ┌──────▼──────┐
  │             │      │ Execute     │ → Run stage handler with retry
  │             │      └──────┬──────┘
  │             │             │
  │             │      ┌──────▼──────┐
  │             │      │ QualityGate │ → Evaluate configured gates
  │             │      └──────┬──────┘
  │             │             │
  │             │      ┌──────▼──────┐
  │             │      │ Artifact    │ → Collect published artifacts
  │             │      └─────────────┘
  └────┬────────┘
       │
  ┌────▼──────────┐
  │  Complete/Fail│  → PipelineCompleted/Failed event published
  └───────────────┘
```

### Events Published

| Event | Trigger |
|---|---|
| `pipeline.started` | Pipeline execution begins |
| `pipeline.completed` | All stages completed successfully |
| `pipeline.failed` | A stage or quality gate failed |
| `pipeline.stage_started` | Individual stage execution begins |
| `pipeline.stage_completed` | Stage completed successfully |
| `pipeline.stage_failed` | Stage execution failed |
| `quality_gate.passed` | Quality gate threshold met |
| `quality_gate.failed` | Quality gate threshold not met |
| `artifact.published` | Artifact published successfully |
| `deployment.requested` | Deployment requested to a target |
| `deployment.started` | Deployment execution begins |
| `deployment.completed` | Deployment completed |
| `deployment.failed` | Deployment failed |

## Quality Gates

Quality gates are evaluated after each stage. Each gate defines:

| Property | Description |
|---|---|
| `type` | One of the 8 gate types (compilation, lint, formatting, unit_tests, coverage, security_scan, dependency_audit, architecture_validation) |
| `severity` | Critical, high, medium, low, or info |
| `required` | Must pass for pipeline to succeed |
| `blocking` | Immediately fails the pipeline if not met |
| `maxErrors` | Maximum allowed errors |
| `maxWarnings` | Maximum allowed warnings |
| `minCoverage` | Minimum coverage percentage |
| `threshold` | Generic numeric threshold |

```typescript
const coverageGate = new QualityGate({
  type: "coverage",
  name: "Coverage Gate",
  severity: "critical",
  required: true,
  blocking: true,
  minCoverage: 80,
});
```

## Artifact Flow

Artifacts are produced by stages (typically `artifact_build` and `artifact_publish`) and collected into the pipeline result.

### Artifact Types

| Type | Description |
|---|---|
| `backend_package` | Compiled backend distribution |
| `docker_image` | Container image reference |
| `documentation` | Generated documentation |
| `coverage_report` | Code coverage reports |
| `openapi_specification` | OpenAPI/Swagger specification |

```typescript
const artifact = new ArtifactDefinition({
  type: "backend_package",
  name: "Backend",
  path: "dist/backend.tar.gz",
  retentionDays: 30,
});

const result = artifact.createResult("1.0.0", "published");
```

## Deployment Targets

Deployment targets define environments with access control policies.

### Target Types

| Type | Required Approval | Allowed Branches | Typical Checks |
|---|---|---|---|
| **Development** | No | All | None |
| **Testing** | No | develop, feature/*, fix/* | unit_tests, integration_tests |
| **Staging** | Yes | develop, release/* | unit_tests, integration_tests, security_scan |
| **Production** | Yes | main, master | unit_tests, integration_tests, security_scan, dependency_audit, coverage |

```typescript
const target = DeploymentTargetFactory.createProduction({
  url: "https://app.tableflow.com",
  approvers: ["lead-dev@example.com", "cto@example.com"],
});

const result = target.createDeploymentResult("deploying", {
  deployedBy: "ci-bot",
  version: "1.0.0",
});
```

## Usage

### Defining a Pipeline

```typescript
const definition = PipelineDefinition.create({
  name: "ci-pipeline",
  version: "1.0.0",
  stages: [
    { type: "source_checkout", name: "Checkout" },
    { type: "dependency_restore", name: "Restore Dependencies", dependsOn: ["source_checkout"] },
    { type: "unit_tests", name: "Unit Tests", dependsOn: ["dependency_restore"], qualityGates: ["coverage"] },
    { type: "artifact_build", name: "Build", dependsOn: ["unit_tests"] },
  ],
  qualityGates: [
    { type: "coverage", name: "Coverage", severity: "critical", required: true, blocking: true, minCoverage: 80 },
    { type: "lint", name: "Lint", severity: "high", required: true, blocking: true, maxErrors: 0 },
  ],
  artifacts: [
    { type: "backend_package", name: "Backend", path: "dist/backend.tgz" },
  ],
});
```

### Registering Stage Handlers

```typescript
const unitTestHandler: StageHandler = {
  stageType: "unit_tests",
  async execute(context, logger) {
    // Run tests, collect results
    return {
      status: "succeeded",
      attempt: 1,
      output: { coverage: 92, errors: 0, warnings: 3 },
    };
  },
};

executor.registerStageHandler(unitTestHandler);
```

### Executing a Pipeline

```typescript
const executor = new PipelineExecutor({
  stageHandlers: [unitTestHandler, buildHandler],
  eventPublisher,
  logger,
});

const result = await executor.execute(definition.toConfig(), {
  branch: "main",
  commitSha: "abc123",
  triggeredBy: "developer@example.com",
});

if (result.isSuccess()) {
  console.log(`Pipeline ${result.runId} completed in ${result.durationMs}ms`);
} else {
  console.error(`Pipeline failed: ${result.error}`);
  console.error(`Failed stages:`, result.getFailedStages());
}
```

## Future Providers

The `CiCdProvider` interface enables integration with any CI platform:

```typescript
interface CiCdProvider {
  readonly name: string;
  readonly providerType: CiCdProviderType;
  executePipeline(definition: PipelineDefinitionConfig, context: PipelineContextData): Promise<PipelineResultData>;
  cancelPipeline(runId: string): Promise<void>;
  getPipelineStatus(runId: string): Promise<PipelineStageStatus>;
}
```

| Provider | Status |
|---|---|
| GitHub Actions | Future |
| GitLab CI | Future |
| Azure DevOps | Future |
| Jenkins | Future |
| CircleCI | Future |
| Bitbucket Pipelines | Future |

To add a new provider:
1. Implement `CiCdProvider`
2. Register via `executor.registerProvider(new YourProvider())`

## Design Principles

- **Provider Agnostic**: Core logic depends only on interfaces, not on any CI platform
- **Strategy Pattern**: Stage handlers are injected, enabling different execution strategies
- **Factory Pattern**: DeploymentTargetFactory creates pre-configured environments
- **Immutable Results**: PipelineResult is immutable after creation
- **Event-Driven**: All lifecycle events are published for observability
- **Defensive Validation**: PipelineDefinition validates all configuration at creation time
- **Retry Resilience**: Stages can be configured with retry count and delay
- **Failure Isolation**: allowFailure on stages prevents cascade failures
