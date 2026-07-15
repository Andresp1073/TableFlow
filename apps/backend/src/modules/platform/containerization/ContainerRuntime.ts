import type {
  ContainerRuntimeConfig,
  ContainerRuntimeType,
  ContainerRuntimeInterface,
  ContainerStatus,
  EnvironmentVariable,
} from "./types.js";
import { CONTAINER_RUNTIME_TYPES } from "./types.js";
import { ContainerValidationError } from "./errors.js";

export class ContainerRuntime {
  readonly type: ContainerRuntimeType;
  readonly name: string;
  readonly image: string;
  readonly command?: string[];
  readonly entrypoint?: string[];
  readonly ports: readonly { containerPort: number; hostPort?: number; protocol: "tcp" | "udp" }[];
  readonly volumes: readonly { source: string; target: string; type: "bind" | "volume" | "tmpfs"; readOnly?: boolean }[];
  readonly environment: readonly EnvironmentVariable[];
  readonly restartPolicy: string;
  readonly stopGracePeriodMs: number;
  readonly readOnly: boolean;
  readonly tmpfs: readonly string[];
  readonly init: boolean;
  readonly labels: Readonly<Record<string, string>>;

  constructor(config: ContainerRuntimeConfig) {
    if (!CONTAINER_RUNTIME_TYPES.includes(config.type)) {
      throw new ContainerValidationError(`Invalid runtime type: ${config.type}`, []);
    }

    this.type = config.type;
    this.name = config.name;
    this.image = config.image;
    this.command = config.command;
    this.entrypoint = config.entrypoint;
    this.ports = Object.freeze([...config.ports]);
    this.volumes = Object.freeze([...config.volumes]);
    this.environment = Object.freeze([...config.environment]);
    this.restartPolicy = config.restartPolicy;
    this.stopGracePeriodMs = config.stopGracePeriodMs;
    this.readOnly = config.readOnly;
    this.tmpfs = Object.freeze([...config.tmpfs]);
    this.init = config.init;
    this.labels = Object.freeze({ ...config.labels });
  }

  getEnvVars(): EnvironmentVariable[] {
    return [...this.environment];
  }

  getSecretEnvVars(): EnvironmentVariable[] {
    return this.environment.filter((e) => e.secret);
  }

  getPublicEnvVars(): EnvironmentVariable[] {
    return this.environment.filter((e) => !e.secret);
  }

  hasHealthChecks(): boolean {
    return this.environment.length > 0;
  }

  static createRuntimeProvider(type: ContainerRuntimeType): ContainerRuntimeInterface {
    switch (type) {
      case "docker":
        return new DockerRuntimeProvider();
      case "podman":
        return new PodmanRuntimeProvider();
      case "containerd":
        return new ContainerdRuntimeProvider();
      case "oci":
        return new OciRuntimeProvider();
    }
  }
}

class DockerRuntimeProvider implements ContainerRuntimeInterface {
  readonly type: ContainerRuntimeType = "docker";

  async create(_config: ContainerRuntimeConfig): Promise<string> {
    return "docker-container-id";
  }

  async start(_containerId: string): Promise<void> {}

  async stop(_containerId: string, _timeoutMs?: number): Promise<void> {}

  async restart(_containerId: string, _timeoutMs?: number): Promise<void> {}

  async remove(_containerId: string, _force?: boolean): Promise<void> {}

  async getStatus(_containerId: string): Promise<ContainerStatus> {
    return { containerId: "", state: "created" };
  }

  async getLogs(_containerId: string, _tail?: number): Promise<string[]> {
    return [];
  }

  async execute(_containerId: string, _command: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return { exitCode: 0, stdout: "", stderr: "" };
  }
}

class PodmanRuntimeProvider implements ContainerRuntimeInterface {
  readonly type: ContainerRuntimeType = "podman";

  async create(_config: ContainerRuntimeConfig): Promise<string> {
    return "podman-container-id";
  }

  async start(_containerId: string): Promise<void> {}

  async stop(_containerId: string, _timeoutMs?: number): Promise<void> {}

  async restart(_containerId: string, _timeoutMs?: number): Promise<void> {}

  async remove(_containerId: string, _force?: boolean): Promise<void> {}

  async getStatus(_containerId: string): Promise<ContainerStatus> {
    return { containerId: "", state: "created" };
  }

  async getLogs(_containerId: string, _tail?: number): Promise<string[]> {
    return [];
  }

  async execute(_containerId: string, _command: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return { exitCode: 0, stdout: "", stderr: "" };
  }
}

class ContainerdRuntimeProvider implements ContainerRuntimeInterface {
  readonly type: ContainerRuntimeType = "containerd";

  async create(_config: ContainerRuntimeConfig): Promise<string> {
    return "containerd-container-id";
  }

  async start(_containerId: string): Promise<void> {}

  async stop(_containerId: string, _timeoutMs?: number): Promise<void> {}

  async restart(_containerId: string, _timeoutMs?: number): Promise<void> {}

  async remove(_containerId: string, _force?: boolean): Promise<void> {}

  async getStatus(_containerId: string): Promise<ContainerStatus> {
    return { containerId: "", state: "created" };
  }

  async getLogs(_containerId: string, _tail?: number): Promise<string[]> {
    return [];
  }

  async execute(_containerId: string, _command: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return { exitCode: 0, stdout: "", stderr: "" };
  }
}

class OciRuntimeProvider implements ContainerRuntimeInterface {
  readonly type: ContainerRuntimeType = "oci";

  async create(_config: ContainerRuntimeConfig): Promise<string> {
    return "oci-bundle-id";
  }

  async start(_containerId: string): Promise<void> {}

  async stop(_containerId: string, _timeoutMs?: number): Promise<void> {}

  async restart(_containerId: string, _timeoutMs?: number): Promise<void> {}

  async remove(_containerId: string, _force?: boolean): Promise<void> {}

  async getStatus(_containerId: string): Promise<ContainerStatus> {
    return { containerId: "", state: "created" };
  }

  async getLogs(_containerId: string, _tail?: number): Promise<string[]> {
    return [];
  }

  async execute(_containerId: string, _command: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return { exitCode: 0, stdout: "", stderr: "" };
  }
}
