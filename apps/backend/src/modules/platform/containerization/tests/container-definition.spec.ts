import { describe, it, expect } from "vitest";
import { ContainerDefinition } from "../ContainerDefinition.js";
import { ContainerBuilder, DockerfileGenerator } from "../ContainerBuilder.js";
import { ContainerRuntime } from "../ContainerRuntime.js";
import { ContainerValidationError } from "../errors.js";
import type { ContainerDefinitionConfig } from "../types.js";

describe("ContainerDefinition", () => {
  const validConfig: ContainerDefinitionConfig = {
    name: "backend",
    baseImage: "node:20-alpine",
    buildStrategy: "multi_stage",
    runtimeType: "docker",
    ports: [{ containerPort: 4000, protocol: "tcp" }],
    volumes: [],
    environment: [],
    healthChecks: [],
    securityProfile: {
      user: "appuser",
      fileSystemAccess: "read_only",
      droppedCapabilities: [],
      addedCapabilities: [],
      allowPrivilegeEscalation: false,
      readonlyRootFilesystem: true,
      tmpfsMounts: [],
    },
    buildStages: [
      { name: "deps", baseImage: "node:20-alpine", commands: ["RUN npm install"] },
      { name: "build", baseImage: "node:20-alpine", commands: ["RUN npm run build"], copyFrom: ["deps"] },
      { name: "runner", baseImage: "node:20-alpine", commands: ["COPY --from=build /app/dist ./dist"] },
    ],
    metadata: { name: "backend", version: "1.0.0", labels: {}, annotations: {} },
  };

  it("creates a valid container definition", () => {
    const def = new ContainerDefinition(validConfig);
    expect(def.name).toBe("backend");
    expect(def.baseImage).toBe("node:20-alpine");
    expect(def.buildStages).toHaveLength(3);
  });

  it("throws on empty name", () => {
    expect(() =>
      new ContainerDefinition({ ...validConfig, name: "" }),
    ).toThrow(ContainerValidationError);
  });

  it("throws on empty base image", () => {
    expect(() =>
      new ContainerDefinition({ ...validConfig, baseImage: "" }),
    ).toThrow(ContainerValidationError);
  });

  it("throws on invalid build strategy", () => {
    expect(() =>
      new ContainerDefinition({ ...validConfig, buildStrategy: "invalid" as never }),
    ).toThrow(ContainerValidationError);
  });

  it("throws on invalid runtime type", () => {
    expect(() =>
      new ContainerDefinition({ ...validConfig, runtimeType: "invalid" as never }),
    ).toThrow(ContainerValidationError);
  });

  it("throws on invalid port range", () => {
    expect(() =>
      new ContainerDefinition({ ...validConfig, ports: [{ containerPort: 0, protocol: "tcp" }] }),
    ).toThrow(ContainerValidationError);
  });

  it("throws on duplicate ports", () => {
    expect(() =>
      new ContainerDefinition({
        ...validConfig,
        ports: [
          { containerPort: 4000, protocol: "tcp" },
          { containerPort: 4000, protocol: "udp" },
        ],
      }),
    ).toThrow(ContainerValidationError);
  });

  it("throws on empty build stages", () => {
    expect(() =>
      new ContainerDefinition({ ...validConfig, buildStages: [] }),
    ).toThrow(ContainerValidationError);
  });

  it("throws on multi-stage with single stage", () => {
    expect(() =>
      new ContainerDefinition({
        ...validConfig,
        buildStages: [{ name: "single", baseImage: "node:20-alpine", commands: [] }],
      }),
    ).toThrow(ContainerValidationError);
  });

  it("converts to runtime config", () => {
    const def = new ContainerDefinition(validConfig);
    const runtime = def.toRuntimeConfig();
    expect(runtime.name).toBe("backend");
    expect(runtime.ports).toHaveLength(1);
    expect(runtime.readOnly).toBe(true);
    expect(runtime.init).toBe(true);
  });

  it("validates volume paths", () => {
    const def = new ContainerDefinition({
      ...validConfig,
      volumes: [{ source: "data", target: "relative/path", type: "volume" }],
    });
    const errors = def.validate();
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("ContainerBuilder", () => {
  it("creates a multi-stage builder", () => {
    const builder = ContainerBuilder.createMultiStageBuilder(
      { name: "deps", baseImage: "node:20-alpine", commands: ["RUN npm install"] },
      { name: "build", baseImage: "node:20-alpine", commands: ["RUN npm run build"], copyFrom: ["deps"] },
      { name: "runner", baseImage: "node:20-alpine", commands: ["COPY --from=build /app/dist ./dist"], user: "appuser" },
    );

    expect(builder.strategy).toBe("multi_stage");
    expect(builder.stages).toHaveLength(3);
  });

  it("creates a single-stage builder", () => {
    const builder = ContainerBuilder.createSingleStageBuilder(
      { name: "dev", baseImage: "node:20-alpine", commands: ["RUN npm install", "CMD node index.js"] },
    );

    expect(builder.strategy).toBe("single_stage");
    expect(builder.stages).toHaveLength(1);
  });

  it("creates a distroless builder", () => {
    const builder = ContainerBuilder.createDistrolessBuilder(
      { name: "build", baseImage: "node:20-alpine", commands: ["RUN npm run build"] },
      { name: "runner", baseImage: "gcr.io/distroless/nodejs20-debian12", commands: ["COPY --from=build /app/dist ./dist"] },
    );

    expect(builder.strategy).toBe("distroless");
    expect(builder.stages).toHaveLength(2);
  });

  it("throws on invalid strategy", () => {
    expect(() =>
      new ContainerBuilder({ strategy: "invalid" as never, stages: [{ name: "s", baseImage: "node", commands: [] }] }),
    ).toThrow(ContainerValidationError);
  });

  it("throws on empty stages", () => {
    expect(() =>
      new ContainerBuilder({ strategy: "single_stage", stages: [] }),
    ).toThrow(ContainerValidationError);
  });

  it("generates Dockerfile instructions", () => {
    const builder = ContainerBuilder.createMultiStageBuilder(
      { name: "deps", baseImage: "node:20-alpine", commands: ["RUN npm install"], workdir: "/app" },
      { name: "build", baseImage: "node:20-alpine", commands: ["RUN npm run build"], copyFrom: ["deps"] },
      { name: "runner", baseImage: "node:20-alpine", commands: ["COPY --from=build /app/dist ./dist"], exposePorts: [4000] },
    );

    const results = builder.generateInstructions();
    expect(results).toHaveLength(3);
    expect(results[0]!.instructions[0]).toContain("FROM");
    expect(results[0]!.instructions[1]).toContain("WORKDIR");
  });

  it("generates complete Dockerfile string", () => {
    const builder = ContainerBuilder.createSingleStageBuilder(
      { name: "dev", baseImage: "node:20-alpine", commands: ["RUN npm install", "RUN npm run build"], exposePorts: [4000] },
    );

    const dockerfile = builder.toDockerfile();
    expect(dockerfile).toContain("syntax=docker/dockerfile:1");
    expect(dockerfile).toContain("FROM node:20-alpine");
    expect(dockerfile).toContain("EXPOSE 4000");
  });
});

describe("DockerfileGenerator", () => {
  it("generates production Dockerfile", () => {
    const dockerfile = DockerfileGenerator.generateProductionDockerfile({
      appName: "backend",
      exposePort: 4000,
    });

    expect(dockerfile).toContain("FROM node:20-alpine AS deps");
    expect(dockerfile).toContain("FROM node:20-alpine AS build");
    expect(dockerfile).toContain("FROM node:20-alpine AS runner");
    expect(dockerfile).toContain("USER appuser");
    expect(dockerfile).toContain('CMD ["node", "dist/main.js"]');
    expect(dockerfile).toContain("EXPOSE 4000");
  });

  it("generates production Dockerfile with Prisma", () => {
    const dockerfile = DockerfileGenerator.generateProductionDockerfile({
      appName: "backend",
      exposePort: 4000,
      prismaGenerate: true,
    });

    expect(dockerfile).toContain("prisma");
    expect(dockerfile).toContain("prisma generate");
  });

  it("generates development Dockerfile", () => {
    const dockerfile = DockerfileGenerator.generateDevelopmentDockerfile({
      appName: "frontend",
      exposePort: 3000,
    });

    expect(dockerfile).toContain("FROM node:20-alpine AS development");
    expect(dockerfile).toContain("EXPOSE 3000");
    expect(dockerfile).not.toContain("FROM node:20-alpine AS deps");
  });

  it("generates dockerignore", () => {
    const content = DockerfileGenerator.generateDockerignore();
    expect(content).toContain("node_modules/");
    expect(content).toContain("dist/");
    expect(content).toContain(".env");
    expect(content).toContain(".git/");
    expect(content).toContain("Dockerfile*");
  });
});

describe("ContainerRuntime", () => {
  it("creates a runtime config", () => {
    const runtime = new ContainerRuntime({
      type: "docker",
      name: "backend",
      image: "backend:1.0.0",
      ports: [{ containerPort: 4000, protocol: "tcp" }],
      volumes: [],
      environment: [],
      healthChecks: [],
      restartPolicy: "unless_stopped",
      securityProfile: {
        user: "appuser",
        fileSystemAccess: "read_only",
        droppedCapabilities: [],
        addedCapabilities: [],
        allowPrivilegeEscalation: false,
        readonlyRootFilesystem: true,
        tmpfsMounts: [],
      },
      labels: {},
      stopGracePeriodMs: 30_000,
      readOnly: true,
      tmpfs: [],
      init: true,
    });

    expect(runtime.type).toBe("docker");
    expect(runtime.image).toBe("backend:1.0.0");
  });

  it("throws on invalid runtime type", () => {
    expect(() =>
      new ContainerRuntime({
        type: "invalid" as never,
        name: "test",
        image: "test:latest",
        ports: [],
        volumes: [],
        environment: [],
        healthChecks: [],
        restartPolicy: "no",
        securityProfile: {
          user: "root",
          fileSystemAccess: "read_write",
          droppedCapabilities: [],
          addedCapabilities: [],
          allowPrivilegeEscalation: false,
          readonlyRootFilesystem: false,
          tmpfsMounts: [],
        },
        labels: {},
        stopGracePeriodMs: 10_000,
        readOnly: false,
        tmpfs: [],
        init: false,
      }),
    ).toThrow(ContainerValidationError);
  });

  it("separates secret and public env vars", () => {
    const runtime = new ContainerRuntime({
      type: "docker",
      name: "test",
      image: "test:latest",
      ports: [],
      volumes: [],
      environment: [
        { key: "PUBLIC_KEY", value: "public", secret: false },
        { key: "SECRET_KEY", value: "secret", secret: true },
      ],
      healthChecks: [],
      restartPolicy: "no",
      securityProfile: {
        user: "root",
        fileSystemAccess: "read_write",
        droppedCapabilities: [],
        addedCapabilities: [],
        allowPrivilegeEscalation: false,
        readonlyRootFilesystem: false,
        tmpfsMounts: [],
      },
      labels: {},
      stopGracePeriodMs: 10_000,
      readOnly: false,
      tmpfs: [],
      init: false,
    });

    expect(runtime.getSecretEnvVars()).toHaveLength(1);
    expect(runtime.getPublicEnvVars()).toHaveLength(1);
  });

  it("creates runtime providers", () => {
    const dockerProvider = ContainerRuntime.createRuntimeProvider("docker");
    expect(dockerProvider.type).toBe("docker");

    const podmanProvider = ContainerRuntime.createRuntimeProvider("podman");
    expect(podmanProvider.type).toBe("podman");
  });
});
