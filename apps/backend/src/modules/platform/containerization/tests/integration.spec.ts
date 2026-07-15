import { describe, it, expect } from "vitest";
import { ContainerDefinition } from "../ContainerDefinition.js";
import { ContainerBuilder, DockerfileGenerator } from "../ContainerBuilder.js";
import { ContainerRuntime } from "../ContainerRuntime.js";
import { ContainerHealth, HealthCheckManager, createStartupCheck, createReadinessCheck, createLivenessCheck } from "../ContainerHealth.js";
import { ContainerSecurityProfile } from "../ContainerSecurityProfile.js";
import { ImageMetadata } from "../ImageMetadata.js";
import {
  ContainerError,
  ContainerValidationError,
  ContainerBuildError,
  ContainerRuntimeError,
  HealthCheckError,
  SecurityProfileError,
} from "../errors.js";
import { createContainerEvent, publishContainerEvent } from "../events.js";
import {
  BUILD_STRATEGY_TYPES,
  CONTAINER_RUNTIME_TYPES,
  HEALTH_CHECK_TYPES,
} from "../types.js";
import type { ContainerDefinitionConfig } from "../types.js";

describe("Integration - Complete Container Definition", () => {
  it("creates a full production container definition", () => {
    const config: ContainerDefinitionConfig = {
      name: "backend",
      baseImage: "node:20-alpine",
      description: "TableFlow Backend API",
      buildStrategy: "multi_stage",
      runtimeType: "docker",
      ports: [
        { containerPort: 4000, protocol: "tcp" },
      ],
      volumes: [
        { source: "backend_data", target: "/app/data", type: "volume" },
      ],
      environment: [
        { key: "NODE_ENV", value: "production" },
        { key: "DATABASE_URL", value: "mysql://db:3306/tableflow", secret: true },
      ],
      healthChecks: [
        {
          type: "startup",
          strategy: "http",
          httpPath: "/health/startup",
          httpPort: 4000,
          intervalMs: 5_000,
          timeoutMs: 3_000,
          retries: 3,
        },
        {
          type: "readiness",
          strategy: "http",
          httpPath: "/health/readiness",
          httpPort: 4000,
          intervalMs: 10_000,
          timeoutMs: 3_000,
          retries: 3,
        },
        {
          type: "liveness",
          strategy: "http",
          httpPath: "/health/liveness",
          httpPort: 4000,
          intervalMs: 30_000,
          timeoutMs: 5_000,
          retries: 3,
        },
      ],
      resources: {
        cpuLimit: "1.0",
        memoryLimit: "512M",
      },
      logging: {
        driver: "json_file",
        options: { "max-size": "10m", "max-file": "3" },
      },
      restartPolicy: "unless_stopped",
      securityProfile: {
        user: "appuser",
        fileSystemAccess: "read_only",
        droppedCapabilities: ["SETUID", "SETGID", "NET_RAW"],
        addedCapabilities: [],
        allowPrivilegeEscalation: false,
        seccompProfile: "default",
        readonlyRootFilesystem: true,
        tmpfsMounts: ["/tmp", "/var/run"],
      },
      buildStages: [
        {
          name: "deps",
          baseImage: "node:20-alpine",
          commands: [
            "RUN corepack enable && corepack prepare pnpm@9 --activate",
            "COPY package.json pnpm-lock.yaml ./",
            "RUN pnpm install --frozen-lockfile",
          ],
          workdir: "/app",
        },
        {
          name: "build",
          baseImage: "node:20-alpine",
          commands: [
            "COPY --from=deps /app/node_modules ./node_modules",
            "COPY . .",
            "RUN pnpm --filter @tableflow/backend build",
          ],
          copyFrom: ["deps"],
          workdir: "/app",
        },
        {
          name: "runner",
          baseImage: "node:20-alpine",
          commands: [
            "RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser",
            "COPY --from=build /app/dist ./dist",
            "COPY --from=build /app/package.json ./",
            "USER appuser",
          ],
          copyFrom: ["build"],
          workdir: "/app",
          exposePorts: [4000],
        },
      ],
      metadata: {
        name: "backend",
        version: "1.0.0",
        description: "TableFlow Backend API",
        vendor: "TableFlow",
        labels: { "com.tableflow.team": "platform" },
        annotations: { "com.tableflow.commit": "abc123" },
        licenses: ["MIT"],
        sourceRepository: "https://github.com/tableflow/tableflow",
      },
    };

    const def = new ContainerDefinition(config);
    expect(def.name).toBe("backend");
    expect(def.buildStages).toHaveLength(3);
    expect(def.healthChecks).toHaveLength(3);
    expect(def.securityProfile.user).toBe("appuser");

    const runtime = def.toRuntimeConfig();
    expect(runtime.image).toBe("backend:1.0.0");
    expect(runtime.ports).toHaveLength(1);
    expect(runtime.readOnly).toBe(true);
    expect(runtime.init).toBe(true);
  });

  it("produces a working Dockerfile from definition", () => {
    const builder = ContainerBuilder.createMultiStageBuilder(
      { name: "deps", baseImage: "node:20-alpine", commands: ["RUN npm install"], workdir: "/app" },
      { name: "build", baseImage: "node:20-alpine", commands: ["RUN npm run build"], copyFrom: ["deps"] },
      {
        name: "runner",
        baseImage: "node:20-alpine",
        commands: [
          "RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser",
          "COPY --from=build /app/dist ./dist",
          "USER appuser",
        ],
        exposePorts: [4000],
      },
    );

    const dockerfile = builder.toDockerfile();
    expect(dockerfile).toContain("syntax=docker/dockerfile:1");
    expect(dockerfile).toContain("AS deps");
    expect(dockerfile).toContain("AS build");
    expect(dockerfile).toContain("AS runner");
    expect(dockerfile).toContain("EXPOSE 4000");
  });
});

describe("Integration - Health Check Lifecycle", () => {
  it("manages full health check lifecycle", async () => {
    const manager = new HealthCheckManager();

    const startup = createStartupCheck();
    const readiness = createReadinessCheck();
    const liveness = createLivenessCheck();

    manager.registerMany([startup, readiness, liveness]);

    manager.registerDependency({ name: "database", type: "mysql", required: true, timeoutMs: 5000 });
    manager.registerDependency({ name: "redis", type: "cache", required: false, timeoutMs: 3000 });

    const endpoints = manager.getEndpoints();
    expect(endpoints).toHaveLength(3);
    expect(endpoints.map((e) => e.type)).toContain("startup");
    expect(endpoints.map((e) => e.type)).toContain("readiness");
    expect(endpoints.map((e) => e.type)).toContain("liveness");

    const startupResult = await manager.performStartupCheck();
    expect(startupResult.status).toBe("healthy");

    const readinessResult = await manager.performReadinessCheck();
    expect(readinessResult.status).toBe("healthy");

    const livenessResult = await manager.performLivenessCheck();
    expect(livenessResult.status).toBe("healthy");

    expect(startupResult.durationMs).toBeGreaterThanOrEqual(0);
    expect(startupResult.timestamp).toBeDefined();
  });
});

describe("Integration - Security Profile Integration", () => {
  it("applies security profile to container definition", () => {
    const securityProfile = ContainerSecurityProfile.createProduction();
    expect(securityProfile.toDockerSecurityOptions().length).toBeGreaterThan(0);

    const config: ContainerDefinitionConfig = {
      name: "secured-app",
      baseImage: "node:20-alpine",
      buildStrategy: "single_stage",
      runtimeType: "docker",
      ports: [{ containerPort: 3000, protocol: "tcp" }],
      volumes: [],
      environment: [],
      healthChecks: [],
      securityProfile: {
        user: securityProfile.user,
        fileSystemAccess: securityProfile.fileSystemAccess,
        droppedCapabilities: [...securityProfile.droppedCapabilities],
        addedCapabilities: [...securityProfile.addedCapabilities],
        allowPrivilegeEscalation: securityProfile.allowPrivilegeEscalation,
        seccompProfile: securityProfile.seccompProfile,
        readonlyRootFilesystem: securityProfile.readonlyRootFilesystem,
        tmpfsMounts: [...securityProfile.tmpfsMounts],
      },
      buildStages: [
        { name: "app", baseImage: "node:20-alpine", commands: ["COPY . .", "CMD node index.js"] },
      ],
      metadata: { name: "secured-app", version: "1.0.0", labels: {}, annotations: {} },
    };

    const def = new ContainerDefinition(config);
    expect(def.securityProfile.user).toBe("appuser");
    expect(def.securityProfile.readonlyRootFilesystem).toBe(true);
  });
});

describe("Integration - Constants and Types", () => {
  it("defines all build strategy types", () => {
    expect(BUILD_STRATEGY_TYPES).toHaveLength(4);
    expect(BUILD_STRATEGY_TYPES).toContain("multi_stage");
    expect(BUILD_STRATEGY_TYPES).toContain("distroless");
    expect(BUILD_STRATEGY_TYPES).toContain("scratch");
  });

  it("defines all runtime types", () => {
    expect(CONTAINER_RUNTIME_TYPES).toHaveLength(4);
    expect(CONTAINER_RUNTIME_TYPES).toContain("docker");
    expect(CONTAINER_RUNTIME_TYPES).toContain("podman");
    expect(CONTAINER_RUNTIME_TYPES).toContain("containerd");
    expect(CONTAINER_RUNTIME_TYPES).toContain("oci");
  });

  it("defines all health check types", () => {
    expect(HEALTH_CHECK_TYPES).toHaveLength(3);
    expect(HEALTH_CHECK_TYPES).toContain("startup");
    expect(HEALTH_CHECK_TYPES).toContain("readiness");
    expect(HEALTH_CHECK_TYPES).toContain("liveness");
  });
});

describe("Integration - Error Classes", () => {
  it("creates container errors with codes", () => {
    const error = new ContainerError("Container failed", "CONTAINER_ERROR");
    expect(error.message).toBe("Container failed");
    expect(error.code).toBe("CONTAINER_ERROR");
  });

  it("creates validation errors", () => {
    const error = new ContainerValidationError("Invalid config", ["Name required", "Image required"]);
    expect(error.code).toBe("CONTAINER_VALIDATION_ERROR");
    expect(error.validationErrors).toHaveLength(2);
  });

  it("creates build errors", () => {
    const error = new ContainerBuildError("build", "Build failed");
    expect(error.stageName).toBe("build");
    expect(error.code).toBe("CONTAINER_BUILD_ERROR");
  });

  it("creates runtime errors", () => {
    const error = new ContainerRuntimeError("container-123", "Container crashed");
    expect(error.containerId).toBe("container-123");
  });

  it("creates health check errors", () => {
    const error = new HealthCheckError("liveness", "Health check failed");
    expect(error.healthCheckType).toBe("liveness");
  });

  it("creates security profile errors", () => {
    const error = new SecurityProfileError("Invalid security configuration");
    expect(error.code).toBe("SECURITY_PROFILE_ERROR");
  });
});

describe("Integration - Dockerfile Generator", () => {
  it("generates production Dockerfile matching existing pattern", () => {
    const dockerfile = DockerfileGenerator.generateProductionDockerfile({
      appName: "backend",
      exposePort: 4000,
      startCommand: ["node", "dist/main.js"],
    });

    expect(dockerfile).toContain("FROM node:20-alpine AS deps");
    expect(dockerfile).toContain("FROM node:20-alpine AS build");
    expect(dockerfile).toContain("FROM node:20-alpine AS runner");
    expect(dockerfile).toContain("USER appuser");
    expect(dockerfile).toContain('CMD ["node", "dist/main.js"]');

    expect(dockerfile).toContain("corepack enable");
    expect(dockerfile).toContain("pnpm install --frozen-lockfile");
    expect(dockerfile).toContain("addgroup --system --gid 1001 nodejs");
  });

  it("generates dockerignore with all recommended patterns", () => {
    const content = DockerfileGenerator.generateDockerignore();
    const lines = content.split("\n").filter((l) => l.length > 0 && !l.startsWith("#"));

    expect(lines).toContain("node_modules/");
    expect(lines).toContain("dist/");
    expect(lines).toContain(".env");
    expect(lines).toContain(".git/");
    expect(lines).toContain("Dockerfile*");
    expect(lines).toContain(".DS_Store");
    expect(lines).toContain("coverage/");
  });
});

describe("Integration - Events", () => {
  it("creates container events", () => {
    const event = createContainerEvent("container.build_started", "backend", "backend:1.0.0");
    expect(event.type).toBe("container.build_started");
    expect(event.payload.containerName).toBe("backend");
    expect(event.payload.imageName).toBe("backend:1.0.0");
  });

  it("publishes events with error handling", async () => {
    const logger = { error: () => {}, warn: () => {}, info: () => {}, debug: () => {}, fatal: () => {}, log: () => {}, child: () => logger } as any;
    await publishContainerEvent(undefined, logger, "container.build_completed", "backend", "backend:1.0.0");
  });

  it("defines all container event types", () => {
    const eventTypes = [
      "container.build_started",
      "container.build_completed",
      "container.build_failed",
      "container.started",
      "container.stopped",
      "container.health_check_passed",
      "container.health_check_failed",
      "container.startup_failed",
      "container.readiness_failed",
      "container.liveness_failed",
    ];

    for (const eventType of eventTypes) {
      const event = createContainerEvent(eventType as any, "test", "test:latest");
      expect(event.type).toBe(eventType);
    }
  });
});
