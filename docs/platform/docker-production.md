# Docker Production Platform

## Architecture

The Containerization module provides a provider-agnostic abstraction layer for building, running, and managing production containers. It follows OCI best practices and DevSecOps principles.

```
┌──────────────────────────────────────────────────────────────────┐
│                        Business Modules                           │
│                    (depend only on container types)                 │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                   ContainerDefinitionInterface                      │
│                    (interface — dependency inversion)                │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                     Containerization Module                         │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │  Container       │  │  Container      │  │  Container       │   │
│  │  Definition      │  │  Builder        │  │  Runtime         │   │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘   │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │  Container       │  │  Container      │  │  Image           │   │
│  │  Health          │  │  Security       │  │  Metadata        │   │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Module Location

```
apps/backend/src/modules/platform/containerization/
├── index.ts                       # Barrel export
├── types.ts                       # All types and interfaces
├── ContainerDefinition.ts         # Container definition with validation
├── ContainerBuilder.ts            # Build strategy and Dockerfile generation
├── ContainerRuntime.ts            # Runtime configuration and providers
├── ContainerHealth.ts             # Health check abstractions
├── ContainerSecurityProfile.ts    # Security profiles with presets
├── ImageMetadata.ts               # OCI-compliant image metadata
├── errors.ts                      # Custom error classes
├── events.ts                      # Event creation and publishing helpers
├── templates/                     # Reserved for future templates
└── tests/                         # Test suite
```

### Core Components

| Component | Responsibility |
|---|---|
| **ContainerDefinition** | Validated container configuration with port/volume/health/security definitions |
| **ContainerBuilder** | Build strategy (multi-stage, single-stage, distroless, scratch) with Dockerfile generation |
| **ContainerRuntime** | Runtime configuration with provider abstraction (Docker, Podman, containerd, OCI) |
| **ContainerHealth** | Health check types (startup, readiness, liveness) with Docker health check config generation |
| **HealthCheckManager** | Registry of health checks with dependency monitoring |
| **ContainerSecurityProfile** | Security profiles with non-root execution, read-only FS, dropped capabilities |
| **ImageMetadata** | OCI-compliant image labels and annotations using org.opencontainers.image spec |
| **DockerfileGenerator** | Production and development Dockerfile templates |

## Image Lifecycle

```
  ┌──────────┐
  │  Define  │  → ContainerDefinition created with stages, ports, security, metadata
  └────┬─────┘
       │
  ┌────▼─────┐
  │  Build   │  → ContainerBuilder generates Dockerfile from build stages
  └────┬─────┘
       │
  ┌────▼────────┐
  │  Security   │  → Security profile applied (non-root, read-only, dropped caps)
  └────┬────────┘
       │
  ┌────▼────────┐
  │  Runtime    │  → ContainerRuntimeConfig created for execution
  └────┬────────┘
       │
  ┌────▼────────┐
  │  Health     │  → Startup → Readiness → Liveness checks
  └────┬────────┘
       │
  ┌────▼────────┐
  │  Metadata   │  → OCI labels and annotations applied
  └─────────────┘
```

### Events Published

| Event | Trigger |
|---|---|
| `container.build_started` | Container image build begins |
| `container.build_completed` | Container image build completes |
| `container.build_failed` | Container image build fails |
| `container.started` | Container instance starts |
| `container.stopped` | Container instance stops |
| `container.health_check_passed` | Health check passes |
| `container.health_check_failed` | Health check fails |
| `container.startup_failed` | Startup health check fails |
| `container.readiness_failed` | Readiness health check fails |
| `container.liveness_failed` | Liveness health check fails |

## Build Strategy

### Multi-Stage Build (Production)

The recommended production build uses three stages:

1. **deps** — Install production dependencies with frozen lockfile
2. **build** — Compile TypeScript, run build steps
3. **runner** — Minimal runtime image with only compiled output

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @tableflow/backend build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
COPY --from=build /app/dist ./dist
USER appuser
EXPOSE 4000
CMD ["node", "dist/main.js"]
```

### Strategies

| Strategy | Stages | Use Case |
|---|---|---|
| `multi_stage` | 3+ (deps, build, runner) | Production builds with minimal final image |
| `single_stage` | 1 | Development, local testing |
| `distroless` | 2 (build, runner) | Minimal attack surface, no shell |
| `scratch` | 2+ | Static binaries, Go/Rust apps |

## Runtime Strategy

### Environment Configuration

- Environment variables from Configuration Center and Secrets Management
- Secret injection via Docker secrets or mounted files
- Environment-specific overrides per deployment target

### Health Endpoints

| Endpoint | Path | Port | Purpose |
|---|---|---|---|
| Startup | `/health/startup` | 4000 | Initial dependency check on boot |
| Readiness | `/health/readiness` | 4000 | Ready to accept traffic |
| Liveness | `/health/liveness` | 4000 | Process is alive and responding |

### Graceful Shutdown

- `SIGTERM` signal handling with configurable grace period (default 30s)
- Drain active connections before exit
- Flush pending logs and metrics

## Security Recommendations

### ContainerSecurityProfile Presets

| Profile | User | Filesystem | Capabilities | Use Case |
|---|---|---|---|---|
| **Production** | `appuser` | Read-only | All dangerous dropped | Deployed services |
| **Development** | `node` | Read-write | Minimal dropped | Local development |
| **Minimal** | `nobody` | Read-only | All dangerous dropped | High-security services |

### Non-Root Execution

Always run containers as a non-root user. The production profile creates a dedicated `appuser` with UID 1001:

```dockerfile
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
USER appuser
```

### Dropped Capabilities

Default dropped capabilities follow the OWASP Docker Cheat Sheet:

```
SETUID, SETGID, NET_RAW, SYS_CHROOT, MKNOD, AUDIT_WRITE,
SETFCAP, FSETID, FOWNER, DAC_OVERRIDE, CHOWN, KILL, SETPCAP,
NET_BIND_SERVICE
```

### Additional Security Measures

- **Read-only root filesystem**: Prevents writes to container filesystem
- **No privilege escalation**: `--security-opt=no-new-privileges:true`
- **Seccomp**: Default Docker seccomp profile
- **AppArmor**: Optional runtime-default profile
- **Tmpfs mounts**: `/tmp` and `/var/run` for writable runtime data

## Usage

### Defining a Container

```typescript
const definition = new ContainerDefinition({
  name: "backend",
  baseImage: "node:20-alpine",
  buildStrategy: "multi_stage",
  runtimeType: "docker",
  ports: [{ containerPort: 4000, protocol: "tcp" }],
  healthChecks: [
    { type: "startup", strategy: "http", httpPath: "/health/startup",
      httpPort: 4000, intervalMs: 5_000, timeoutMs: 3_000, retries: 3 },
    { type: "readiness", strategy: "http", httpPath: "/health/readiness",
      httpPort: 4000, intervalMs: 10_000, timeoutMs: 3_000, retries: 3 },
    { type: "liveness", strategy: "http", httpPath: "/health/liveness",
      httpPort: 4000, intervalMs: 30_000, timeoutMs: 5_000, retries: 3 },
  ],
  securityProfile: ContainerSecurityProfile.createProduction(),
  buildStages: [
    { name: "deps", baseImage: "node:20-alpine", commands: ["RUN pnpm install"], workdir: "/app" },
    { name: "build", baseImage: "node:20-alpine", commands: ["RUN pnpm build"], copyFrom: ["deps"] },
    { name: "runner", baseImage: "node:20-alpine", commands: ["COPY --from=build /app/dist ./dist"],
      exposePorts: [4000], user: "appuser" },
  ],
  metadata: ImageMetadata.createBackend("1.0.0"),
});
```

### Generating a Production Dockerfile

```typescript
const dockerfile = DockerfileGenerator.generateProductionDockerfile({
  appName: "backend",
  exposePort: 4000,
  prismaGenerate: true,
});

// Write to docker/Dockerfile.backend
```

### Generating a Development Dockerfile

```typescript
const dockerfile = DockerfileGenerator.generateDevelopmentDockerfile({
  appName: "backend",
  exposePort: 4000,
  devCommand: "pnpm --filter @tableflow/backend dev",
});
```

### Applying Security Profile

```typescript
const profile = ContainerSecurityProfile.createProduction();
const dockerOptions = profile.toDockerSecurityOptions();
// Returns: ["--user=appuser", "--read-only", "--cap-drop=SETUID", ...]
```

## Future Extensions

| Extension | Status |
|---|---|
| Docker Compose | Future |
| Podman | Future (provider stub exists) |
| BuildKit | Future |
| OCI Images | Future (provider stub exists) |
| Distroless Images | Future (builder strategy exists) |

## Design Principles

- **OCI Compliance**: Image metadata follows the Open Containers Initiative specification
- **Defense in Depth**: Multiple security layers (non-root, read-only FS, dropped capabilities, seccomp)
- **Provider Agnostic**: Runtime abstractions for Docker, Podman, containerd, and OCI
- **Strategy Pattern**: Build strategies encapsulate different Dockerfile generation approaches
- **Immutable Definitions**: ContainerDefinition is validated at construction time
- **Factory Presets**: ContainerSecurityProfile and ImageMetadata provide production-ready defaults
- **Observability**: All lifecycle events published via Event Bus
