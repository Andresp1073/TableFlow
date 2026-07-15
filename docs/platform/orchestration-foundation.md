# Orchestration Foundation

## Architecture

The Orchestration Foundation provides a cloud-agnostic abstraction layer for deploying, scaling, and managing containerized workloads. It follows Cloud Native principles and the Twelve-Factor App methodology.

```
┌──────────────────────────────────────────────────────────────────┐
│                        Business Modules                           │
│                    (depend only on orchestration types)             │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                     DeploymentManagerInterface                      │
│                    (interface — dependency inversion)                │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                     DeploymentManager                               │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │  Deployment     │  │  Deployment     │  │  Scaling         │   │
│  │  Definition     │  │  Strategy       │  │  Policy          │   │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘   │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │  Runtime        │  │  Service        │  │  Network         │   │
│  │  Profile        │  │  Definition     │  │  Policy          │   │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Module Location

```
apps/backend/src/modules/platform/orchestration/
├── index.ts                       # Barrel export
├── types.ts                       # All types and interfaces
├── DeploymentDefinition.ts        # Deployment configuration with validation
├── DeploymentStrategy.ts          # Strategy pattern for 4 deployment strategies
├── DeploymentManager.ts           # Deployment orchestration engine
├── RuntimeProfile.ts              # Resource profiles with affinity, tolerations
├── ScalingPolicy.ts               # Scaling abstractions (horizontal, vertical, auto, scheduled)
├── ServiceDefinition.ts           # Service model (internal, external, LB, headless)
├── NetworkPolicyDefinition.ts     # Network policy abstractions
├── errors.ts                      # Custom error classes
├── events.ts                      # Event creation and publishing helpers
└── tests/                         # Test suite
```

### Core Components

| Component | Responsibility |
|---|---|
| **DeploymentDefinition** | Validated deployment configuration with strategy, runtime, scaling, service, network |
| **DeploymentStrategy** | Strategy pattern interface with 4 implementations (RollingUpdate, BlueGreen, Canary, Recreate) |
| **DeploymentStrategyFactory** | Registry and factory for deployment strategies with custom strategy support |
| **DeploymentManager** | Orchestration engine for deploy, scale, rollback, status, delete, list |
| **RuntimeProfile** | Resource requirements, affinity, anti-affinity, node selectors, tolerations |
| **ScalingPolicy** | Scaling configurations (horizontal, vertical, auto, scheduled) with replica calculation |
| **ServiceDefinition** | Service types (internal, external, load_balanced, headless) with port mapping |
| **NetworkPolicyDefinition** | Network policy abstractions with presets (deny-all, allow-all, isolated) |

## Deployment Lifecycle

```
  ┌──────────┐
  │  Define  │  → DeploymentDefinition with strategy, runtime, scaling
  └────┬─────┘
       │
  ┌────▼────────┐
  │  Validate   │  → Strategy validation, resource validation
  └────┬────────┘
       │
  ┌────▼────────┐
  │  Strategy   │  → Strategy.execute() selected by type
  └────┬────────┘
       │
  ┌────▼──────────────┐
  │  Deploy           │  → Provider-agnostic deployment execution
  │  ┌──────────────┐ │
  │  │ Rolling      │ │  → Gradual pod replacement (zero downtime)
  │  │ Blue/Green   │ │  → Parallel environment with traffic switch
  │  │ Canary       │ │  → Phased rollout with weight progression
  │  │ Recreate     │ │  → Terminate all, then create new (downtime)
  │  └──────────────┘ │
  └────┬──────────────┘
       │
  ┌────▼────────┐
  │  Health     │  → Readiness/liveness checks pass
  └────┬────────┘
       │
  ┌────▼──────────────┐
  │  Complete / Fail  │  → DeploymentStarted/Completed/Failed events
  └───────────────────┘
```

### Events Published

| Event | Trigger |
|---|---|
| `deployment.started` | Deployment execution begins |
| `deployment.completed` | Deployment completes successfully |
| `deployment.failed` | Deployment fails |
| `deployment.rolled_back` | Deployment rolled back to previous revision |
| `deployment.strategy_changed` | Deployment strategy modified |
| `scaling.triggered` | Scaling action initiated |
| `scaling.completed` | Scaling action completes |
| `scaling.failed` | Scaling action fails |
| `service.created` | Service created |
| `service.updated` | Service updated |
| `service.deleted` | Service deleted |

## Deployment Strategies

### Rolling Update

Gradually replaces pods with new ones, ensuring zero downtime.

```typescript
const strategy = new RollingUpdateStrategy();
const result = await strategy.execute("backend", 5, {
  type: "rolling_update",
  rollingUpdate: {
    maxUnavailable: "25%",   // Max pods unavailable during update
    maxSurge: "25%",          // Max extra pods during update
  },
});
```

### Blue/Green

Creates a new environment (green) alongside the existing one (blue), then switches traffic.

```typescript
const strategy = new BlueGreenStrategy();
const result = await strategy.execute("frontend", 5, {
  type: "blue_green",
  blueGreen: {
    previewServiceName: "frontend-preview",
    activeServiceName: "frontend-active",
    autoPromote: true,
    promoteDelayMs: 300_000,
  },
});
```

### Canary

Rolls out changes to a small subset of users before full deployment.

```typescript
const strategy = new CanaryStrategy();
const result = await strategy.execute("api", 10, {
  type: "canary",
  canary: {
    steps: [
      { weight: 10, pauseMs: 60_000 },     // 10% traffic, 1min pause
      { weight: 50, pauseMs: 120_000 },    // 50% traffic, 2min pause
      { weight: 100, pauseMs: 0 },         // 100% traffic, complete
    ],
    trafficMirroring: false,
    analysisDurationMs: 300_000,
  },
});
```

### Recreate

Terminates all existing pods before creating new ones (downtime expected).

```typescript
const strategy = new RecreateStrategy();
const result = await strategy.execute("worker", 3, {
  type: "recreate",
  recreate: {
    maxShutdownTimeMs: 30_000,
  },
});
```

## Scaling Strategies

| Strategy | Description | Use Case |
|---|---|---|
| **Horizontal** | Fixed replica count | Stateless services with stable load |
| **Vertical** | Adjust resource limits | Stateful services, legacy apps |
| **Auto** | Metric-driven scaling | Variable traffic, production services |
| **Scheduled** | Time-based scaling | Known traffic patterns, batch jobs |

### Auto Scaling Example

```typescript
const policy = ScalingPolicy.createAutoScaling(2, 10, 80);
// Scales between 2-10 replicas targeting 80% CPU utilization
```

### Scheduled Scaling Example

```typescript
const policy = ScalingPolicy.createScheduled([
  { name: "peak", cronExpression: "0 9 * * 1-5", targetReplicas: 10, timezone: "UTC" },
  { name: "off-peak", cronExpression: "0 18 * * 1-5", targetReplicas: 3, timezone: "UTC" },
]);
```

## Runtime Model

### Resource Profiles

| Profile | CPU Request | Memory Request | CPU Limit | Memory Limit | Affinity |
|---|---|---|---|---|---|
| **Default** | 100m | 128Mi | 500m | 512Mi | None |
| **Minimal** | 50m | 64Mi | 200m | 256Mi | None |
| **Production** | 250m | 256Mi | 1 | 1Gi | Pod anti-affinity + topology spread |

### Affinity and Anti-Affinity

The production profile includes pod anti-affinity to spread pods across nodes:

```typescript
const profile = RuntimeProfile.createProduction("backend");
// Adds preferred anti-affinity across hosts
// Adds topology spread constraints across zones
```

### Taints and Tolerations

```typescript
const profile = new RuntimeProfile({
  name: "gpu-worker",
  resources: {
    requests: { cpu: "1", memory: "4Gi" },
    limits: { cpu: "2", memory: "8Gi", gpu: { count: 1, type: "nvidia" } },
  },
  tolerations: [{ key: "gpu", operator: "Exists", effect: "NoSchedule" }],
});
```

## Service Model

| Service Type | Cluster IP | External Access | Use Case |
|---|---|---|---|
| **Internal** | Assigned | No | Backend-to-backend communication |
| **External** | None | Via externalName | External service integration |
| **Load Balanced** | Assigned | Via LB | Public-facing APIs, web apps |
| **Headless** | None | No | StatefulSets, service discovery |

## Network Policies

| Preset | Ingress | Egress | Use Case |
|---|---|---|---|
| **Deny All Ingress** | Denied | Allowed | Isolated services |
| **Allow All Ingress** | Allowed | Allowed | Public-facing services |
| **Allow Specific** | Port + peer restricted | Allowed | Internal APIs |
| **Isolated** | Allowed | Allowed | Fully isolated with default deny |

## Usage

### Deploy a Service

```typescript
const manager = new DeploymentManager({
  eventPublisher,
  logger,
});

const result = await manager.deploy({
  name: "backend",
  labels: { app: "backend", tier: "api" },
  replicas: 5,
  strategy: {
    type: "rolling_update",
    rollingUpdate: { maxUnavailable: "25%", maxSurge: "25%" },
  },
  runtimeProfile: {
    name: "backend-profile",
    resources: {
      requests: { cpu: "250m", memory: "256Mi" },
      limits: { cpu: "1", memory: "1Gi" },
    },
  },
  scalingPolicy: ScalingPolicy.createAutoScaling(2, 10, 80),
  serviceDefinition: ServiceDefinition.createLoadBalancer("backend", 4000, { app: "backend" }),
  healthCheckPath: "/health/readiness",
  healthCheckPort: 4000,
  paused: false,
});
```

### Scale and Rollback

```typescript
// Scale horizontally
const scalingResult = await manager.scale("backend", 10);

// Rollback to previous revision
const rollbackResult = await manager.rollback("backend");
```

## Future Providers

The `OrchestrationProvider` interface enables integration with any orchestration platform:

```typescript
interface OrchestrationProvider {
  readonly name: string;
  readonly providerType: OrchestrationProviderType;
  deploy(config: DeploymentDefinitionConfig): Promise<DeploymentResult>;
  scale(name: string, replicas: number): Promise<ScalingResult>;
  rollback(name: string, revision?: string): Promise<DeploymentResult>;
  getStatus(name: string): Promise<DeploymentResult>;
  delete(name: string): Promise<void>;
}
```

| Provider | Status |
|---|---|
| Kubernetes | Future |
| OpenShift | Future |
| Amazon ECS | Future |
| Azure Container Apps | Future |
| HashiCorp Nomad | Future |
| Google Cloud Run | Future |

## Design Principles

- **Strategy Pattern**: Deployment strategies are pluggable and isolated
- **Factory Pattern**: DeploymentStrategyFactory manages strategy registry and creation
- **Provider Agnostic**: Core logic depends only on interfaces, not on any orchestrator
- **Cloud Native**: Follows CNCF best practices and the Twelve-Factor App
- **Defense in Depth**: Network policies, resource limits, affinity rules at every level
- **Immutable Definitions**: DeploymentDefinition validated at construction time
- **Event-Driven**: All lifecycle events published for observability
- **Custom Strategies**: New deployment strategies can be registered without modifying core
