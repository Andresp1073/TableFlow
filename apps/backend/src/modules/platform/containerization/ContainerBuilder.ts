import type {
  BuildStage,
  BuildStrategyType,
  ContainerBuilderOptions,
  ContainerRuntimeType,
} from "./types.js";
import { BUILD_STRATEGY_TYPES } from "./types.js";
import { ContainerValidationError } from "./errors.js";

export interface BuildStageResult {
  name: string;
  baseImage: string;
  instructions: string[];
}

export class ContainerBuilder {
  readonly strategy: BuildStrategyType;
  readonly stages: readonly BuildStage[];
  readonly options: ContainerBuilderOptions;

  constructor(options: ContainerBuilderOptions) {
    if (!BUILD_STRATEGY_TYPES.includes(options.strategy)) {
      throw new ContainerValidationError(`Invalid build strategy: ${options.strategy}`, []);
    }

    if (options.stages.length === 0) {
      throw new ContainerValidationError("At least one build stage is required", []);
    }

    if (options.strategy === "multi_stage" && options.stages.length < 2) {
      throw new ContainerValidationError("Multi-stage build requires at least 2 stages", []);
    }

    this.strategy = options.strategy;
    this.stages = Object.freeze([...options.stages]);
    this.options = { ...options };
  }

  generateInstructions(): BuildStageResult[] {
    return this.stages.map((stage) => ({
      name: stage.name,
      baseImage: stage.baseImage,
      instructions: this.buildStageInstructions(stage),
    }));
  }

  private buildStageInstructions(stage: BuildStage): string[] {
    const instructions: string[] = [];

    if (stage.platform) {
      instructions.push(`FROM --platform=${stage.platform} ${stage.baseImage} AS ${stage.name}`);
    } else {
      instructions.push(`FROM ${stage.baseImage} AS ${stage.name}`);
    }

    if (stage.workdir) {
      instructions.push(`WORKDIR ${stage.workdir}`);
    }

    if (stage.user) {
      instructions.push(`USER ${stage.user}`);
    }

    if (stage.env && Object.keys(stage.env).length > 0) {
      for (const [key, value] of Object.entries(stage.env)) {
        instructions.push(`ENV ${key}=${value}`);
      }
    }

    if (stage.labels && Object.keys(stage.labels).length > 0) {
      for (const [key, value] of Object.entries(stage.labels)) {
        instructions.push(`LABEL ${key}=${value}`);
      }
    }

    if (stage.copyFrom && stage.copyFrom.length > 0) {
      for (const source of stage.copyFrom) {
        instructions.push(`COPY --from=${source} . ./`);
      }
    }

    for (const command of stage.commands) {
      instructions.push(command);
    }

    if (stage.exposePorts && stage.exposePorts.length > 0) {
      for (const port of stage.exposePorts) {
        instructions.push(`EXPOSE ${port}`);
      }
    }

    return instructions;
  }

  static createMultiStageBuilder(
    depsStage: BuildStage,
    buildStage: BuildStage,
    runtimeStage: BuildStage,
    options?: Partial<ContainerBuilderOptions>,
  ): ContainerBuilder {
    return new ContainerBuilder({
      strategy: "multi_stage",
      stages: [depsStage, buildStage, runtimeStage],
      ...options,
    });
  }

  static createSingleStageBuilder(
    stage: BuildStage,
    options?: Partial<ContainerBuilderOptions>,
  ): ContainerBuilder {
    return new ContainerBuilder({
      strategy: "single_stage",
      stages: [stage],
      ...options,
    });
  }

  static createDistrolessBuilder(
    buildStage: BuildStage,
    runtimeStage: BuildStage,
    options?: Partial<ContainerBuilderOptions>,
  ): ContainerBuilder {
    return new ContainerBuilder({
      strategy: "distroless",
      stages: [buildStage, runtimeStage],
      ...options,
    });
  }

  toDockerfile(): string {
    const results = this.generateInstructions();
    const lines: string[] = [];

    lines.push("# syntax=docker/dockerfile:1");
    lines.push(`# Build strategy: ${this.strategy}`);
    lines.push("");

    for (let i = 0; i < results.length; i++) {
      const result = results[i]!;

      if (i > 0) {
        lines.push("");
      }

      lines.push(`# Stage ${i + 1}: ${result.name}`);
      for (const instruction of result.instructions) {
        lines.push(instruction);
      }
    }

    lines.push("");
    return lines.join("\n");
  }
}

export class DockerfileGenerator {
  static generateProductionDockerfile(options: {
    appName: string;
    nodeVersion?: string;
    workdir?: string;
    exposePort: number;
    buildCommand?: string;
    startCommand?: string[];
    prismaGenerate?: boolean;
  }): string {
    const nodeVersion = options.nodeVersion ?? "20-alpine";
    const workdir = options.workdir ?? "/app";
    const buildCommand = options.buildCommand ?? "pnpm --filter @tableflow/backend build";
    const startCommand = options.startCommand ?? ["node", "dist/main.js"];

    const builder = ContainerBuilder.createMultiStageBuilder(
      {
        name: "deps",
        baseImage: `node:${nodeVersion}`,
        commands: [
          `COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./`,
          `COPY apps/${options.appName}/package.json apps/${options.appName}/`,
          `COPY packages/shared/package.json packages/shared/`,
          `COPY packages/types/package.json packages/types/`,
          `RUN corepack enable && corepack prepare pnpm@9 --activate`,
          `RUN pnpm install --frozen-lockfile`,
        ],
        workdir,
      },
      {
        name: "build",
        baseImage: `node:${nodeVersion}`,
        commands: [
          `COPY --from=deps ${workdir}/node_modules ./node_modules`,
          `COPY --from=deps ${workdir}/apps/${options.appName}/node_modules ./apps/${options.appName}/node_modules`,
          `COPY . .`,
          `RUN corepack enable && corepack prepare pnpm@9 --activate`,
          `RUN ${buildCommand}`,
        ],
        copyFrom: ["deps"],
        workdir,
      },
      {
        name: "runner",
        baseImage: `node:${nodeVersion}`,
        commands: [
          `RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser`,
          `COPY --from=build ${workdir}/apps/${options.appName}/dist ./dist`,
          `COPY --from=build ${workdir}/apps/${options.appName}/package.json ./`,
          ...(options.prismaGenerate ? [`COPY --from=build ${workdir}/apps/${options.appName}/prisma ./prisma`, `RUN corepack enable && corepack prepare pnpm@9 --activate && pnpm install --frozen-lockfile --prod && npx prisma generate`] : []),
          `USER appuser`,
        ],
        copyFrom: ["build"],
        workdir,
        exposePorts: [options.exposePort],
        user: "appuser",
      },
    );

    const dockerfile = builder.toDockerfile();
    const cmdLine = startCommand.join(" ");
    return `${dockerfile}CMD ["${startCommand.join('", "')}"]\n`;
  }

  static generateDevelopmentDockerfile(options: {
    appName: string;
    nodeVersion?: string;
    workdir?: string;
    exposePort: number;
    devCommand?: string;
  }): string {
    const nodeVersion = options.nodeVersion ?? "20-alpine";
    const workdir = options.workdir ?? "/app";
    const devCommand = options.devCommand ?? "pnpm --filter @tableflow/backend dev";

    const builder = ContainerBuilder.createSingleStageBuilder(
      {
        name: "development",
        baseImage: `node:${nodeVersion}`,
        commands: [
          `RUN corepack enable && corepack prepare pnpm@9 --activate`,
          `RUN apk add --no-cache git curl`,
          `WORKDIR ${workdir}`,
          `COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./`,
          `COPY apps/${options.appName}/package.json apps/${options.appName}/`,
          `COPY packages/shared/package.json packages/shared/`,
          `COPY packages/types/package.json packages/types/`,
          `RUN pnpm install`,
          `COPY . .`,
          `EXPOSE ${options.exposePort}`,
        ],
        exposePorts: [options.exposePort],
        workdir,
      },
    );

    const dockerfile = builder.toDockerfile();
    return `${dockerfile}CMD ["${devCommand}"]\n`;
  }

  static generateDockerignore(): string {
    return [
      "# Dependencies",
      "node_modules/",
      "",
      "# Build output",
      "dist/",
      ".next/",
      "build/",
      ".tsbuildinfo",
      "",
      "# Environment",
      ".env",
      ".env.*",
      "!.env.example",
      "",
      "# Version control",
      ".git/",
      ".gitignore",
      ".gitattributes",
      "",
      "# IDE",
      ".vscode/",
      ".idea/",
      "*.swp",
      "*.swo",
      "",
      "# OS",
      ".DS_Store",
      "Thumbs.db",
      "",
      "# Logs",
      "*.log",
      "logs/",
      "",
      "# Docker",
      "docker/",
      "Dockerfile*",
      ".dockerignore",
      "",
      "# CI/CD",
      ".github/",
      ".gitlab-ci.yml",
      "",
      "# Test",
      "coverage/",
      "*.spec.ts",
      "*.test.ts",
      "__tests__/",
      "",
      "# Temp",
      "tmp/",
      "temp/",
      ".cache/",
    ].join("\n");
  }
}
